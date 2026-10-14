import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, exists, not, or } from "drizzle-orm";

import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { playersToTournaments } from "@fsx/db/schema/players-to-tournaments";
import { tournaments, insertTournamentSchema } from "@fsx/db/schema/tournaments";
import type { Context } from "../context";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { httpUrl, idInput, isoDate, nameText, positiveInt, ratingTypeSchema, searchText } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { COMPETITION_TIERS } from "../circuit-types";
import { matchesAllWords, SEARCH_RESULT_LIMIT, SEARCH_SCAN_LIMIT, searchWords } from "../lib/name-search";

const tierEnum = z.enum(COMPETITION_TIERS);

const RATED_TOURNAMENT_MESSAGE =
  "This tournament has rating results. Revert them on the tournament's edit page before changing its rating type or deleting it.";

export const tournamentsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournaments.findMany({
      columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true, tier: true },
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
      const words = searchWords(input.query);
      const rows = await ctx.db
        .select({ id: tournaments.id, name: tournaments.name })
        .from(tournaments)
        .orderBy(desc(tournaments.date), desc(tournaments.id))
        .limit(SEARCH_SCAN_LIMIT);
      return rows.filter((tournament) => matchesAllWords(tournament.name, words)).slice(0, SEARCH_RESULT_LIMIT);
    }),
  byId: publicProcedure
    .input(idInput)
    .query(async ({ ctx, input }) =>
      requireFound(await ctx.db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.id),
        columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true, tier: true },
        with: {
          championship: { columns: { id: true, name: true } },
          tournamentPodiums: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: { id: true, place: true, category: true, playerId: true },
            orderBy: (podium, { asc }) => [asc(podium.category), asc(podium.place), asc(podium.id)],
            with: {
              player: { columns: { id: true, name: true, nickname: true, imageUrl: true } },
            },
          },
        },
      }), "Tournament")
    ),
  create: adminProcedure
    .input(insertTournamentSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      chessResults: httpUrl.nullable().optional(),
      date: isoDate.nullable().optional(),
      ratingType: ratingTypeSchema,
      championshipId: positiveInt.nullable().optional(),
      tier: tierEnum.default("B"),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournaments).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
      chessResults: httpUrl.nullable().optional(),
      date: isoDate.nullable().optional(),
      ratingType: ratingTypeSchema.optional(),
      championshipId: positiveInt.nullable().optional(),
      tier: tierEnum.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasResults = exists(
        ctx.db.select({ id: playersToTournaments.id }).from(playersToTournaments).where(eq(playersToTournaments.tournamentId, input.id)),
      );
      const rows = await ctx.db
        .update(tournaments)
        .set(input)
        .where(and(
          eq(tournaments.id, input.id),
          input.ratingType ? or(eq(tournaments.ratingType, input.ratingType), not(hasResults)) : undefined,
        ))
        .returning();
      if (rows.length === 0 && input.ratingType && await tournamentExists(ctx.db, input.id)) {
        throw new TRPCError({ code: "CONFLICT", message: RATED_TOURNAMENT_MESSAGE });
      }
      return requireMutationRows(rows, "Tournament");
    }),
  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.query.playersToTournaments.findFirst({
      where: eq(playersToTournaments.tournamentId, input.id),
      columns: { id: true },
    });
    if (result) throw new TRPCError({ code: "CONFLICT", message: RATED_TOURNAMENT_MESSAGE });
    const podium = await ctx.db.query.tournamentPodiums.findFirst({
      where: eq(tournamentPodiums.tournamentId, input.id),
      columns: { id: true },
    });
    if (podium) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This tournament has podiums. Remove them before deleting it.",
      });
    }
    return requireMutationRows(
      await ctx.db
        .delete(tournaments)
        .where(eq(tournaments.id, input.id))
        .returning({ id: tournaments.id }),
      "Tournament",
    );
  }),
});

async function tournamentExists(db: Context["db"], id: number) {
  return (await db.query.tournaments.findFirst({ where: eq(tournaments.id, id), columns: { id: true } })) !== undefined;
}
