import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, exists, not, or, sql } from "drizzle-orm";

import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { tournaments, insertTournamentSchema } from "@fsx/db/schema/tournaments";
import { normalizeName } from "@fsx/db/normalize";
import type { Context } from "../context";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { httpUrl, isoDate, nameText, positiveInt, searchText } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";
import { escapeLike, like } from "../sql-like";

const ratingTypeEnum = z.enum(["blitz", "rapid", "classic"]);

const RATED_TOURNAMENT_MESSAGE =
  "This tournament has rating results. Revert them on the tournament's edit page before changing its rating type or deleting it.";

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
        .where(words.length ? like(sql`lower(${tournaments.name})`, `%${words.map(escapeLike).join("%")}%`) : undefined)
        .orderBy(desc(tournaments.date), desc(tournaments.id))
        .limit(10);
    }),
  byId: publicProcedure
    .input(z.object({ id: positiveInt }))
    .query(async ({ ctx, input }) =>
      requireFound(await ctx.db.query.tournaments.findFirst({
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
      }), "Tournament")
    ),
  create: adminProcedure
    .input(insertTournamentSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      chessResults: httpUrl.nullable().optional(),
      date: isoDate.nullable().optional(),
      ratingType: ratingTypeEnum,
      championshipId: positiveInt.nullable().optional(),
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
      ratingType: ratingTypeEnum.optional(),
      championshipId: positiveInt.nullable().optional(),
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
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.query.playersToTournaments.findFirst({
        where: eq(playersToTournaments.tournamentId, input.id),
        columns: { id: true },
      });
      if (result) throw new TRPCError({ code: "CONFLICT", message: RATED_TOURNAMENT_MESSAGE });
      return requireMutationRows(
        await ctx.db.delete(tournaments).where(eq(tournaments.id, input.id)).returning({ id: tournaments.id }),
        "Tournament",
      );
    }),
});

async function tournamentExists(db: Context["db"], id: number) {
  return (await db.query.tournaments.findFirst({ where: eq(tournaments.id, id), columns: { id: true } })) !== undefined;
}
