import { TRPCError } from "@trpc/server";
import { and, eq, exists, gt, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

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

// Each rating-history row records the rating before it was applied, so rows of
// one player and rating type form a chain in insertion (id) order. Changing or
// removing a row shifts the player's rating and every later row's old_rating by
// the same delta. Deltas are computed from the stored rows inside the batch, so
// the chain stays consistent even if the row changed after it was read.
// Later variations are kept as recorded: the federation computes them outside
// the site and a small shift in the starting rating does not change them.

function ratingColumn(ratingType: RatingType) {
  return players[ratingType];
}

async function findHistoryRow(db: RatingDatabase, id: number) {
  const row = await db.query.playersToTournaments.findFirst({
    where: eq(playersToTournaments.id, id),
    columns: { id: true, playerId: true, ratingType: true, variation: true },
    with: { player: { columns: { blitz: true, rapid: true, classic: true } } },
  });
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Rating result not found" });
  return { ...row, ratingType: row.ratingType as RatingType };
}

function assertRatingInRange(rating: number) {
  if (rating < 0 || rating > 4000) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The corrected rating would be outside 0–4000" });
  }
}

export async function correctRatingVariation(db: RatingDatabase, input: { id: number; variation: number }) {
  const row = await findHistoryRow(db, input.id);
  assertRatingInRange(row.player[row.ratingType] + input.variation - row.variation);

  const target = alias(playersToTournaments, "target");
  const targetRow = db.select({ id: target.id }).from(target).where(eq(target.id, input.id));
  const storedVariation = db.select({ variation: target.variation }).from(target).where(eq(target.id, input.id));
  const delta = sql<number>`${input.variation} - (${storedVariation})`;
  const column = ratingColumn(row.ratingType);

  const [, , corrected, [player]] = await db.batch([
    db
      .update(players)
      .set({ [row.ratingType]: sql`${column} + ${delta}` })
      .where(and(eq(players.id, row.playerId), exists(targetRow))),
    db
      .update(playersToTournaments)
      .set({ oldRating: sql`${playersToTournaments.oldRating} + ${delta}` })
      .where(and(
        eq(playersToTournaments.playerId, row.playerId),
        eq(playersToTournaments.ratingType, row.ratingType),
        gt(playersToTournaments.id, input.id),
        exists(targetRow),
      )),
    db
      .update(playersToTournaments)
      .set({ variation: input.variation })
      .where(eq(playersToTournaments.id, input.id))
      .returning({ id: playersToTournaments.id, oldRating: playersToTournaments.oldRating, variation: playersToTournaments.variation }),
    db.select({ rating: column }).from(players).where(eq(players.id, row.playerId)),
  ]);
  const [result] = corrected;
  if (!result || !player) throw new TRPCError({ code: "NOT_FOUND", message: "Rating result not found" });
  return { ...result, ratingType: row.ratingType, rating: player.rating };
}

export async function removeRatingResult(db: RatingDatabase, input: { id: number }) {
  const row = await findHistoryRow(db, input.id);
  assertRatingInRange(row.player[row.ratingType] - row.variation);

  const target = alias(playersToTournaments, "target");
  const targetRow = db.select({ id: target.id }).from(target).where(eq(target.id, input.id));
  const storedVariation = db.select({ variation: target.variation }).from(target).where(eq(target.id, input.id));
  const column = ratingColumn(row.ratingType);

  const [, , removed, [player]] = await db.batch([
    db
      .update(players)
      .set({ [row.ratingType]: sql`${column} - (${storedVariation})` })
      .where(and(eq(players.id, row.playerId), exists(targetRow))),
    db
      .update(playersToTournaments)
      .set({ oldRating: sql`${playersToTournaments.oldRating} - (${storedVariation})` })
      .where(and(
        eq(playersToTournaments.playerId, row.playerId),
        eq(playersToTournaments.ratingType, row.ratingType),
        gt(playersToTournaments.id, input.id),
        exists(targetRow),
      )),
    db
      .delete(playersToTournaments)
      .where(eq(playersToTournaments.id, input.id))
      .returning({ id: playersToTournaments.id }),
    db.select({ rating: column }).from(players).where(eq(players.id, row.playerId)),
  ]);
  if (removed.length !== 1 || !player) throw new TRPCError({ code: "NOT_FOUND", message: "Rating result not found" });
  return { id: input.id, ratingType: row.ratingType, rating: player.rating };
}

export async function revertTournamentRatings(db: RatingDatabase, input: { tournamentId: number }) {
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, input.tournamentId),
    columns: { id: true, ratingType: true },
  });
  if (!tournament) throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
  const ratingType = tournament.ratingType as RatingType;
  const column = ratingColumn(ratingType);

  const result = alias(playersToTournaments, "result");
  const variationOf = (playerId: typeof players.id | typeof playersToTournaments.playerId) =>
    db
      .select({ variation: result.variation })
      .from(result)
      .where(and(eq(result.playerId, playerId), eq(result.tournamentId, input.tournamentId)));
  const resultIdOf = db
    .select({ id: result.id })
    .from(result)
    .where(and(eq(result.playerId, playersToTournaments.playerId), eq(result.tournamentId, input.tournamentId)));
  const participants = db
    .select({ playerId: result.playerId })
    .from(result)
    .where(eq(result.tournamentId, input.tournamentId));

  const [, , removed] = await db.batch([
    db
      .update(players)
      .set({ [ratingType]: sql`${column} - (${variationOf(players.id)})` })
      .where(inArray(players.id, participants)),
    db
      .update(playersToTournaments)
      .set({ oldRating: sql`${playersToTournaments.oldRating} - (${variationOf(playersToTournaments.playerId)})` })
      .where(and(
        eq(playersToTournaments.ratingType, ratingType),
        inArray(playersToTournaments.playerId, participants),
        gt(playersToTournaments.id, resultIdOf),
      )),
    db
      .delete(playersToTournaments)
      .where(eq(playersToTournaments.tournamentId, input.tournamentId))
      .returning({ id: playersToTournaments.id }),
  ]);
  return { reverted: removed.length };
}
