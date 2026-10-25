import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, or, isNotNull } from "drizzle-orm";

import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { tournaments } from "@fsx/db/schema/tournaments";
import { adminProcedure, publicProcedure, router } from "../index";
import { bulkIds, categoryName, idInput, positiveInt } from "../input-schemas";
import type { Context } from "../context";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { requireCategories } from "../services/categories";

const podiumInput = z.object({
  playerId: positiveInt,
  tournamentId: positiveInt,
  place: positiveInt.max(100_000),
  category: categoryName.nullable().optional(),
});

const MAX_BULK_PODIUMS = 50;

const bulkPodiumsInput = z
  .object({
    tournamentId: positiveInt,
    podiums: z
      .array(
        z.object({
          playerId: positiveInt,
          place: positiveInt.max(100_000),
          category: categoryName.nullable().optional(),
        }),
      )
      .min(1)
      .max(MAX_BULK_PODIUMS),
  })
  .refine(
    ({ podiums }) =>
      new Set(podiums.map((p) => `${p.playerId}:${p.category ?? ""}`)).size === podiums.length,
    { message: "A player can appear only once per category.", path: ["podiums"] },
  );

async function requirePodiums(db: Context["db"], tournamentIds: number[]) {
  const off = await db
    .select({ name: tournaments.name })
    .from(tournaments)
    .where(and(inArray(tournaments.id, tournamentIds), eq(tournaments.hasPodiums, false)))
    .limit(1);
  if (off[0]) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `“${off[0].name}” has podiums turned off. Turn them on in the tournament first.` });
  }
}

async function assertManual(db: Context["db"], ids: number[]) {
  const [synced] = await db
    .select({ id: tournamentPodiums.id })
    .from(tournamentPodiums)
    .where(and(inArray(tournamentPodiums.id, ids), or(isNotNull(tournamentPodiums.circuitResultId), isNotNull(tournamentPodiums.tvSergipeId))))
    .limit(1);
  if (synced) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This podium comes from a circuit stage or School Games result. Edit or delete that result instead.",
    });
  }
}

export const tournamentPodiumsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournamentPodiums.findMany({
      columns: { id: true, playerId: true, tournamentId: true, place: true, category: true },
      with: {
        player: { columns: { id: true, name: true } },
        tournament: { columns: { id: true, name: true } },
      },
       orderBy: (tp, { asc }) => [asc(tp.tournamentId), asc(tp.category), asc(tp.place), asc(tp.id)],
       limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  listByTournament: adminProcedure
    .input(z.object({ tournamentId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.tournamentPodiums.findMany({
        where: eq(tournamentPodiums.tournamentId, input.tournamentId),
        columns: { id: true, playerId: true, place: true, category: true, circuitResultId: true, tvSergipeId: true },
        with: { player: { columns: { id: true, name: true } } },
        orderBy: [asc(tournamentPodiums.category), asc(tournamentPodiums.place), asc(tournamentPodiums.id)],
        limit: PUBLIC_COLLECTION_LIMIT,
      })
    ),
  bulkDelete: adminProcedure.input(z.object({ ids: bulkIds })).mutation(async ({ ctx, input }) => {
    await assertManual(ctx.db, input.ids);
    const deleted = await ctx.db
      .delete(tournamentPodiums)
      .where(inArray(tournamentPodiums.id, input.ids))
      .returning({ id: tournamentPodiums.id });
    return { deleted: requireMutationRows(deleted, "Podiums").length, requested: input.ids.length };
  }),
  createMany: adminProcedure
    .input(bulkPodiumsInput)
    .mutation(async ({ ctx, input }) => {
      await requireCategories(ctx.db, input.podiums.map((podium) => podium.category));
      await requirePodiums(ctx.db, [input.tournamentId]);
      const inserts = input.podiums.map((podium) =>
        ctx.db
          .insert(tournamentPodiums)
          .values({ ...podium, tournamentId: input.tournamentId, category: podium.category ?? null })
          .returning({ id: tournamentPodiums.id }),
      );
      const results = await ctx.db.batch(inserts as [(typeof inserts)[number], ...(typeof inserts)[number][]]);
      return results.flat();
    }),
  create: adminProcedure
    .input(podiumInput)
    .mutation(async ({ ctx, input }) => {
      await requireCategories(ctx.db, [input.category]);
      await requirePodiums(ctx.db, [input.tournamentId]);
      return ctx.db.insert(tournamentPodiums).values({ ...input, category: input.category ?? null }).returning();
    }),
  update: adminProcedure
    .input(podiumInput.extend({ id: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      await assertManual(ctx.db, [input.id]);
      await requireCategories(ctx.db, [input.category]);
      await requirePodiums(ctx.db, [input.tournamentId]);
      return requireMutationRows(
        await ctx.db
          .update(tournamentPodiums)
          .set({ playerId: input.playerId, tournamentId: input.tournamentId, place: input.place, category: input.category ?? null })
          .where(eq(tournamentPodiums.id, input.id))
          .returning(),
        "Tournament podium",
      );
    }),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      await assertManual(ctx.db, [input.id]);
      return requireMutationRows(
        await ctx.db.delete(tournamentPodiums).where(eq(tournamentPodiums.id, input.id)).returning({ id: tournamentPodiums.id }),
        "Tournament podium",
      );
    }),
});
