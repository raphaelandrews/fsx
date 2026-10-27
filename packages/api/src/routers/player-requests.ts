import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

import { env } from "@fsx/env/server";

import { players } from "@fsx/db/schema/players";
import { playerUpdateRequests, UPDATE_REQUEST_STATUSES } from "@fsx/db/schema/player-update-requests";

import { requireFound, requireMutationRows } from "../errors";
import { base64ToBytes, hasImageSignature } from "../lib/image-validation";
import { MEDIA_EXTENSIONS, MEDIA_POLICIES, PENDING_PHOTO_MAX_BYTES, RASTER_MIMES } from "../media-kinds";
import { deleteMediaUrl, deletePendingPhoto, deleteReplacedMedia } from "../services/media-storage";
import { adminProcedure, publicProcedure, router } from "../index";
import { birthYear, idInput, positiveInt } from "../input-schemas";
import { turnstileSecret, verifyTurnstile } from "../http/turnstile";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { deleteById } from "../crud";

// An anonymous form writes to D1, so the table is bounded by design: a few open
// requests per player and a cap overall, on top of the per-IP mutation limit.
export const MAX_PENDING_PER_PLAYER = 3;
export const MAX_PENDING_TOTAL = 300;
// Photos are the expensive part (up to 2 MB each in R2), so they have a smaller cap of their own.
export const MAX_PENDING_PHOTOS = 100;
// Decided requests older than this are offered for deletion in the dashboard.
export const RETENTION_DAYS = 90;

const PHOTO_BASE64_MAX = Math.ceil((PENDING_PHOTO_MAX_BYTES * 4) / 3) + 4;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const submitInput = z
  .object({
    playerId: positiveInt,
    birthYear: birthYear.optional(),
    clubId: positiveInt.optional(),
    locationId: positiveInt.optional(),
    cbxId: positiveInt.optional(),
    fideId: positiveInt.optional(),
    photo: z.object({ mime: z.enum(RASTER_MIMES), data: z.string().min(16).max(PHOTO_BASE64_MAX) }).optional(),
    consent: z.literal(true),
    // A field real visitors never see: a bot that fills every input fails validation.
    website: z.string().max(0).optional(),
    // Cloudflare Turnstile token; required only when the deployment has a secret key.
    turnstileToken: z.string().max(2048).optional(),
  })
  .refine(
    (value) => [value.birthYear, value.clubId, value.locationId, value.cbxId, value.fideId, value.photo].some((field) => field !== undefined),
    { message: "Informe pelo menos um dado para atualizar.", path: ["birthYear"] },
  );

const proposedFields = (request: typeof playerUpdateRequests.$inferSelect) => ({
  ...(request.birthYear !== null ? { birthYear: request.birthYear } : {}),
  ...(request.clubId !== null ? { clubId: request.clubId } : {}),
  ...(request.locationId !== null ? { locationId: request.locationId } : {}),
  ...(request.cbxId !== null ? { cbxId: request.cbxId } : {}),
  ...(request.fideId !== null ? { fideId: request.fideId } : {}),
});

export const playerRequestsRouter = router({
  // Public on purpose: the only mutation an anonymous visitor can run. It stores a
  // proposal and changes nothing else; messages are Portuguese because the public
  // form shows them as they are.
  submit: publicProcedure.input(submitInput).mutation(async ({ ctx, input }) => {
    const secret = turnstileSecret();
    if (secret && !(input.turnstileToken && (await verifyTurnstile(input.turnstileToken, secret)))) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Não foi possível confirmar que você não é um robô. Atualize a página e tente de novo.",
      });
    }
    requireFound(
      await ctx.db.query.players.findFirst({ where: eq(players.id, input.playerId), columns: { id: true } }),
      "Player",
    );
    const pendingPhotos = and(eq(playerUpdateRequests.status, "pending"), isNotNull(playerUpdateRequests.photoKey));
    const [forPlayer, total, photosTotal] = await ctx.db.batch([
      ctx.db
        .select({ value: count() })
        .from(playerUpdateRequests)
        .where(and(eq(playerUpdateRequests.playerId, input.playerId), eq(playerUpdateRequests.status, "pending"))),
      ctx.db.select({ value: count() }).from(playerUpdateRequests).where(eq(playerUpdateRequests.status, "pending")),
      ctx.db.select({ value: count() }).from(playerUpdateRequests).where(pendingPhotos),
    ]);
    if ((forPlayer[0]?.value ?? 0) >= MAX_PENDING_PER_PLAYER) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Já existem solicitações em análise para este jogador. Aguarde a resposta da FSX.",
      });
    }
    if ((total[0]?.value ?? 0) >= MAX_PENDING_TOTAL) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Estamos com muitas solicitações em análise. Tente novamente mais tarde.",
      });
    }

    if (input.photo && (photosTotal[0]?.value ?? 0) >= MAX_PENDING_PHOTOS) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Estamos com muitas fotos em análise. Envie a solicitação sem foto ou tente novamente mais tarde.",
      });
    }

    const { consent: _consent, website: _website, turnstileToken: _token, photo, ...fields } = input;
    let photoKey: string | undefined;
    if (photo) {
      const bytes = base64ToBytes(photo.data);
      if (bytes.byteLength < MEDIA_POLICIES.players.minBytes) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A foto é pequena demais. Envie uma foto de verdade." });
      }
      if (bytes.byteLength > PENDING_PHOTO_MAX_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A foto é grande demais. O limite é 2 MB." });
      }
      if (!hasImageSignature(bytes, photo.mime)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O arquivo não parece ser uma imagem JPEG, PNG ou WebP." });
      }
      photoKey = `pending/${crypto.randomUUID()}.${MEDIA_EXTENSIONS[photo.mime]}`;
      await env.IMAGES.put(photoKey, bytes, { httpMetadata: { contentType: photo.mime } });
    }
    try {
      // The caps above only give friendly messages; this insert re-checks them in the same statement,
      // so parallel submits cannot all pass a count that is stale by the time they write.
      const inserted = await ctx.db.all<{ id: number }>(sql`
        INSERT INTO player_update_requests (player_id, birth_year, club_id, location_id, cbx_id, fide_id, photo_key)
        SELECT ${fields.playerId}, ${fields.birthYear ?? null}, ${fields.clubId ?? null}, ${fields.locationId ?? null},
               ${fields.cbxId ?? null}, ${fields.fideId ?? null}, ${photoKey ?? null}
        WHERE (SELECT count(*) FROM player_update_requests WHERE player_id = ${fields.playerId} AND status = 'pending') < ${MAX_PENDING_PER_PLAYER}
          AND (SELECT count(*) FROM player_update_requests WHERE status = 'pending') < ${MAX_PENDING_TOTAL}
          AND (${photoKey ?? null} IS NULL OR (SELECT count(*) FROM player_update_requests WHERE status = 'pending' AND photo_key IS NOT NULL) < ${MAX_PENDING_PHOTOS})
        RETURNING id`);
      if (inserted.length === 0) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Já existem solicitações em análise. Aguarde a resposta da FSX ou tente novamente mais tarde.",
        });
      }
    } catch (error) {
      await deletePendingPhoto(photoKey);
      throw error;
    }
    return { received: true as const };
  }),

  list: adminProcedure
    .input(z.object({ status: z.enum(UPDATE_REQUEST_STATUSES).optional() }).optional())
    .query(({ ctx, input }) =>
      ctx.db.query.playerUpdateRequests.findMany({
        columns: { id: true, status: true, birthYear: true, clubId: true, locationId: true, cbxId: true, fideId: true, photoKey: true, createdAt: true, reviewedAt: true },
        with: { player: { columns: { id: true, name: true } } },
        where: input?.status ? eq(playerUpdateRequests.status, input.status) : undefined,
        orderBy: [sql`${playerUpdateRequests.status} != 'pending'`, desc(playerUpdateRequests.createdAt), desc(playerUpdateRequests.id)],
        limit: PUBLIC_COLLECTION_LIMIT,
      }),
    ),

  byId: adminProcedure.input(idInput).query(async ({ ctx, input }) =>
    requireFound(
      await ctx.db.query.playerUpdateRequests.findFirst({
        where: eq(playerUpdateRequests.id, input.id),
        with: {
          club: { columns: { id: true, name: true } },
          location: { columns: { id: true, name: true } },
          player: {
            columns: { id: true, name: true, nickname: true, birthYear: true, cbxId: true, fideId: true, verified: true },
            with: { club: { columns: { id: true, name: true } }, location: { columns: { id: true, name: true } } },
          },
        },
      }),
      "Request",
    ),
  ),

  // Pending photos are private: only an administrator reads them, as a data URL for the review page.
  photo: adminProcedure.input(idInput).query(async ({ ctx, input }) => {
    const request = requireFound(
      await ctx.db.query.playerUpdateRequests.findFirst({ where: eq(playerUpdateRequests.id, input.id), columns: { photoKey: true } }),
      "Request",
    );
    const object = request.photoKey ? await env.IMAGES.get(request.photoKey) : null;
    if (!object) return null;
    const bytes = new Uint8Array(await object.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { dataUrl: `data:${object.httpMetadata?.contentType ?? "image/jpeg"};base64,${btoa(binary)}` };
  }),

  // One batch: the player is updated and the request closed together or not at all,
  // so a unique-ID clash leaves the request pending with its message intact.
  approve: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const request = requireFound(
      await ctx.db.query.playerUpdateRequests.findFirst({ where: eq(playerUpdateRequests.id, input.id) }),
      "Request",
    );
    if (request.status !== "pending") {
      throw new TRPCError({ code: "CONFLICT", message: "This request was already reviewed." });
    }
    // The photo moves to the public players/ key first; if the batch fails it is removed again.
    const pending = request.photoKey ? await env.IMAGES.get(request.photoKey) : null;
    let photoUrl: string | undefined;
    let photoMime: (typeof RASTER_MIMES)[number] | undefined;
    if (pending) {
      photoMime = RASTER_MIMES.find((mime) => mime === pending.httpMetadata?.contentType) ?? "image/jpeg";
      const key = `players/${crypto.randomUUID()}.${MEDIA_EXTENSIONS[photoMime]}`;
      await env.IMAGES.put(key, await pending.arrayBuffer(), { httpMetadata: { contentType: photoMime } });
      photoUrl = `/api/media/${key}`;
    }
    const previous = photoUrl
      ? (await ctx.db.query.players.findFirst({ where: eq(players.id, request.playerId), columns: { imageUrl: true } }))?.imageUrl
      : undefined;

    let closed;
    try {
      [, closed] = await ctx.db.batch([
        ctx.db
          .update(players)
          .set({ ...proposedFields(request), ...(photoUrl ? { imageUrl: photoUrl } : {}), verified: true })
          .where(and(
            eq(players.id, request.playerId),
            sql`EXISTS (SELECT 1 FROM player_update_requests WHERE id = ${input.id} AND status = 'pending')`,
          )),
        ctx.db
          .update(playerUpdateRequests)
          .set({ status: "approved", photoKey: null, reviewedAt: sql`(CURRENT_TIMESTAMP)` })
          .where(and(eq(playerUpdateRequests.id, input.id), eq(playerUpdateRequests.status, "pending")))
          .returning({ id: playerUpdateRequests.id }),
      ]);
    } catch (error) {
      await deleteMediaUrl(ctx.db, photoUrl);
      throw error;
    }
    if (closed.length === 0) {
      await deleteMediaUrl(ctx.db, photoUrl);
      throw new TRPCError({ code: "CONFLICT", message: "This request was already reviewed." });
    }
    await deletePendingPhoto(request.photoKey);
    await deleteReplacedMedia(ctx.db, previous, photoUrl);
    // The player's photo is decided, so other photos still waiting for the same player are moot: their
    // objects go, and their requests stay for their other fields.
    if (photoUrl) {
      const others = await ctx.db
        .select({ id: playerUpdateRequests.id, photoKey: playerUpdateRequests.photoKey })
        .from(playerUpdateRequests)
        .where(and(eq(playerUpdateRequests.playerId, request.playerId), eq(playerUpdateRequests.status, "pending"), isNotNull(playerUpdateRequests.photoKey)));
      if (others.length > 0) {
        await ctx.db.update(playerUpdateRequests).set({ photoKey: null }).where(inArray(playerUpdateRequests.id, others.map((row) => row.id)));
        await Promise.all(others.map((row) => deletePendingPhoto(row.photoKey)));
      }
    }
    const result = requireMutationRows(closed, "Request");
    return { id: result[0]!.id, photo: photoUrl ? ("applied" as const) : request.photoKey ? ("missing" as const) : ("none" as const) };
  }),

  reject: adminProcedure
    .input(z.object({ id: positiveInt, reviewNote: optionalText(500) }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.query.playerUpdateRequests.findFirst({ where: eq(playerUpdateRequests.id, input.id), columns: { photoKey: true } });
      const closed = await ctx.db
        .update(playerUpdateRequests)
        .set({ status: "rejected", photoKey: null, reviewNote: input.reviewNote ?? null, reviewedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(and(eq(playerUpdateRequests.id, input.id), eq(playerUpdateRequests.status, "pending")))
        .returning({ id: playerUpdateRequests.id });
      if (closed.length === 0) {
        requireFound(
          await ctx.db.query.playerUpdateRequests.findFirst({ where: eq(playerUpdateRequests.id, input.id), columns: { id: true } }),
          "Request",
        );
        throw new TRPCError({ code: "CONFLICT", message: "This request was already reviewed." });
      }
      await deletePendingPhoto(before?.photoKey);
      return closed;
    }),

  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const before = await ctx.db.query.playerUpdateRequests.findFirst({ where: eq(playerUpdateRequests.id, input.id), columns: { photoKey: true } });
    const deleted = await deleteById(ctx.db, playerUpdateRequests, input.id, "Request");
    await deletePendingPhoto(before?.photoKey);
    return deleted;
  }),

  // Retention: old decided requests are cleared in bulk.
  deleteReviewed: adminProcedure
    .input(z.object({ olderThanDays: z.number().int().min(0).max(3650).default(RETENTION_DAYS) }).default({ olderThanDays: RETENTION_DAYS }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(playerUpdateRequests)
        .where(
          and(
            ne(playerUpdateRequests.status, "pending"),
            sql`${playerUpdateRequests.reviewedAt} < datetime('now', ${`-${input.olderThanDays} days`})`,
          ),
        )
        .returning({ id: playerUpdateRequests.id });
      return { deleted: deleted.length };
    }),
});
