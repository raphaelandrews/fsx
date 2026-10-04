import { z } from "zod";
import { eq, desc, count, sql } from "drizzle-orm";

import { normalizeName } from "@fsx/db/normalize";
import { announcements, insertAnnouncementSchema } from "@fsx/db/schema/announcements";
import { players } from "@fsx/db/schema/players";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { contentText, idInput, page, positiveInt } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

const SUGGESTION_LIMIT = 5;
const EXCERPT_LENGTH = 200;

// Whole words only: spaces around both sides keep "ana" from matching "mariana".
const wordsOf = (text: string) => ` ${normalizeName(text).replace(/[^a-z0-9]+/g, " ").trim()} `;

export const announcementsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: announcements.id,
        year: announcements.year,
        number: announcements.number,
        content: announcements.content,
        playerName: players.name,
      })
      .from(announcements)
      .leftJoin(players, eq(players.id, announcements.playerId))
      .orderBy(desc(announcements.year), desc(announcements.number), desc(announcements.id))
      .limit(PUBLIC_COLLECTION_LIMIT),
  ),
  byId: publicProcedure.input(idInput).query(async ({ ctx, input }) =>
    requireFound(await ctx.db.query.announcements.findFirst({
      columns: { id: true, year: true, number: true, content: true, playerId: true },
      where: eq(announcements.id, input.id),
      with: { player: { columns: { id: true, name: true, nickname: true } } },
    }), "Announcement"),
  ),
  byPage: publicProcedure
    .input(z.object({ page }))
    .query(async ({ ctx, input }) => {
      const validPage = Math.max(1, input.page);
      const perPage = 12;
      const data = await ctx.db.query.announcements.findMany({
        columns: { id: true, year: true, number: true, content: true },
        orderBy: [desc(announcements.year), desc(announcements.number), desc(announcements.id)],
        limit: perPage,
        offset: (validPage - 1) * perPage,
      });
      const countResult = await ctx.db.select({ value: count() }).from(announcements);
      const totalItems = countResult[0]?.value ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
      return {
        announcements: data,
        pagination: {
          currentPage: validPage,
          totalPages,
          totalItems,
          itemsPerPage: perPage,
          hasNextPage: validPage < totalPages,
          hasPreviousPage: validPage > 1,
        },
      };
    }),
  fresh: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: announcements.id,
        year: announcements.year,
        number: announcements.number,
        content: announcements.content,
      })
      .from(announcements)
      .orderBy(desc(announcements.year), desc(announcements.number), desc(announcements.id))
      .limit(8),
  ),
  byPlayer: publicProcedure
    .input(z.object({ playerId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db
        .select({
          id: announcements.id,
          year: announcements.year,
          number: announcements.number,
          excerpt: sql<string>`substr(${announcements.content}, 1, ${EXCERPT_LENGTH})`,
        })
        .from(announcements)
        .where(eq(announcements.playerId, input.playerId))
        .orderBy(desc(announcements.year), desc(announcements.number), desc(announcements.id))
        .limit(PUBLIC_COLLECTION_LIMIT),
    ),
  // Players whose full name (two words or more) appears in the text, ignoring
  // accents and case. Only a hint for linking: the admin confirms each one.
  suggestPlayers: adminProcedure
    .input(z.object({ content: contentText }))
    .query(({ ctx, input }) =>
      ctx.db
        .select({ id: players.id, name: players.name })
        .from(players)
        .where(sql`instr(${players.normalizedName}, ' ') > 0
          AND instr(${wordsOf(input.content)}, ' ' || ${players.normalizedName} || ' ') > 0`)
        .orderBy(desc(players.active), desc(sql`length(${players.normalizedName})`), players.id)
        .limit(SUGGESTION_LIMIT),
    ),
  create: adminProcedure
    .input(insertAnnouncementSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      year: z.number().int().min(1900).max(2200),
      number: positiveInt.max(100_000),
      content: contentText,
      playerId: positiveInt.nullable().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.db.insert(announcements).values(input).returning()),
  update: adminProcedure
    .input(
      z.object({
        id: positiveInt,
        year: z.number().int().min(1900).max(2200).optional(),
        number: positiveInt.max(100_000).optional(),
        content: contentText.optional(),
        playerId: positiveInt.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(announcements).set(input).where(eq(announcements.id, input.id)).returning(),
        "Announcement",
      )
    ),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(announcements).where(eq(announcements.id, input.id)).returning({ id: announcements.id }),
        "Announcement",
      )
    ),
});
