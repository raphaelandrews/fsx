import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";

import { tournaments, insertTournamentSchema } from "@fsx/db/schema/tournaments";
import { normalizeName } from "@fsx/db/normalize";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { nameText, positiveInt, searchText, urlText } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

const ratingTypeEnum = z.enum(["blitz", "rapid", "classic"]);

export const tournamentsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournaments.findMany({
      columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true },
      with: {
        championship: { columns: { id: true, name: true } },
      },
       orderBy: (tournaments, { desc, asc }) => [desc(tournaments.date), asc(tournaments.id)],
       limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  search: publicProcedure
    .input(z.object({ query: searchText }))
    .query(async ({ ctx, input }) => {
      const query = normalizeName(input.query);
      const words = query.split(/\s+/).filter(Boolean);
      return ctx.db
        .select({ id: tournaments.id, name: tournaments.name })
        .from(tournaments)
        .where(words.length ? sql`lower(${tournaments.name}) LIKE ${`%${words.join("%")}%`}` : undefined)
        .orderBy(desc(tournaments.date), desc(tournaments.id))
        .limit(10);
    }),
  byId: publicProcedure
    .input(z.object({ id: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.id),
        columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true },
        with: {
          championship: { columns: { id: true, name: true } },
          tournamentPodiums: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: { id: true, place: true, playerId: true },
            with: {
              player: { columns: { id: true, name: true, nickname: true, imageUrl: true } },
            },
          },
        },
      })
    ),
  create: adminProcedure
    .input(insertTournamentSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      chessResults: urlText.nullable().optional(),
      date: z.string().max(40).nullable().optional(),
      ratingType: ratingTypeEnum,
      championshipId: positiveInt.nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournaments).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: searchText.optional(),
      chessResults: z.string().url().max(2_048).nullable().optional(),
      date: z.string().max(40).nullable().optional(),
      ratingType: ratingTypeEnum.optional(),
      championshipId: positiveInt.nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(tournaments).set(input).where(eq(tournaments.id, input.id)).returning(),
        "Tournament",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(tournaments).where(eq(tournaments.id, input.id)).returning({ id: tournaments.id }),
        "Tournament",
      )
    ),
});
