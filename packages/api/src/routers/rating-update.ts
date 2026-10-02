import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";

import type { createDb } from "@fsx/db";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments, type NewPlayerToTournament } from "@fsx/db/schema/playersToTournaments";
import { tournaments } from "@fsx/db/schema/tournaments";

export const RATING_TYPES = ["blitz", "rapid", "classic"] as const;
export type RatingType = (typeof RATING_TYPES)[number];

export interface RatingUpdateInput {
  playerId: number;
  tournamentId: number;
  variation: number;
  ratingType: RatingType;
}

type RatingDatabase = ReturnType<typeof createDb>;
type RatingHistoryResult = Pick<NewPlayerToTournament, "oldRating" | "variation"> & { id: number };

export function calculateUpdatedRating(oldRating: number, variation: number): number {
  const updatedRating = oldRating + variation;
  if (updatedRating < 0 || updatedRating > 4000) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Updated rating is outside the valid range" });
  }
  return updatedRating;
}

export async function applyRatingUpdate(
  db: RatingDatabase,
  input: RatingUpdateInput,
): Promise<RatingHistoryResult[]> {
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, input.tournamentId),
    columns: { id: true, ratingType: true },
  });
  if (!tournament) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
  }
  if (tournament.ratingType !== input.ratingType) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Rating type does not match the tournament",
    });
  }

  const player = await db.query.players.findFirst({
    where: eq(players.id, input.playerId),
    columns: { id: true, blitz: true, rapid: true, classic: true },
  });
  if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });

  const oldRating = player[input.ratingType];
  const newRating = calculateUpdatedRating(oldRating, input.variation);

  const update = db
    .update(players)
    .set({ [input.ratingType]: newRating })
    .where(and(eq(players.id, input.playerId), eq(players[input.ratingType], oldRating)))
    .returning({ id: players.id });

  const history = db
    .insert(playersToTournaments)
    .select(
      db
        .select({
          id: sql<number>`NULL`.as("id"),
          playerId: sql<number>`${input.playerId}`.as("playerId"),
          tournamentId: sql<number>`${input.tournamentId}`.as("tournamentId"),
          oldRating: sql<number>`${oldRating}`.as("oldRating"),
          variation: sql<number>`${input.variation}`.as("variation"),
          ratingType: sql<RatingType>`${input.ratingType}`.as("ratingType"),
          createdAt: sql<string>`CURRENT_TIMESTAMP`.as("createdAt"),
          updatedAt: sql<string>`CURRENT_TIMESTAMP`.as("updatedAt"),
        })
        .from(players)
        .where(and(
          eq(players.id, input.playerId),
          eq(players[input.ratingType], newRating),
          sql`changes() = 1`,
        ))
        .limit(1),
    )
    .returning({ id: playersToTournaments.id, oldRating: playersToTournaments.oldRating, variation: playersToTournaments.variation });

  const [updatedRows, historyRows] = await db.batch([update, history]);
  if (updatedRows.length !== 1) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "The player rating changed. Reload and try again.",
    });
  }
  if (historyRows.length !== 1) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The rating history could not be recorded.",
    });
  }
  return historyRows;
}
