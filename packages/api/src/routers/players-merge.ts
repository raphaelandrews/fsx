import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, notExists } from "drizzle-orm";
import { alias, type SQLiteColumn } from "drizzle-orm/sqlite-core";

import { announcements } from "@fsx/db/schema/announcements";
import { circuitFinalPodiums } from "@fsx/db/schema/circuitFinalPodiums";
import { circuitPodiums } from "@fsx/db/schema/circuitPodiums";
import { cupGames } from "@fsx/db/schema/cupGames";
import { cupMatches } from "@fsx/db/schema/cupMatches";
import { cupPlayers } from "@fsx/db/schema/cupPlayers";
import { defendingChampions } from "@fsx/db/schema/defendingChampions";
import { players } from "@fsx/db/schema/players";
import { playersToInsignias } from "@fsx/db/schema/playersToInsignias";
import { playersToNorms } from "@fsx/db/schema/playersToNorms";
import { playersToRoles } from "@fsx/db/schema/playersToRoles";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournamentPodiums";
import { tvSergipe } from "@fsx/db/schema/tvSergipe";

import type { createDb } from "@fsx/db";

type Database = ReturnType<typeof createDb>;

const PROFILE_FIELDS = ["nickname", "imageUrl", "cbxId", "fideId", "birthDate", "clubId", "locationId", "description"] as const;

const key = (...parts: unknown[]) => parts.join("|");

function overlap(source: string[], target: string[]): string[] {
  const owned = new Set(target);
  return source.filter((value) => owned.has(value));
}

async function findConflicts(db: Database, sourceId: number, targetId: number): Promise<string[]> {
  const [
    sourceResults, targetResults,
    sourcePodiums, targetPodiums,
    sourceFinals, targetFinals,
    sourceTv, targetTv,
  ] = await db.batch([
    db.select({ tournamentId: playersToTournaments.tournamentId }).from(playersToTournaments).where(eq(playersToTournaments.playerId, sourceId)),
    db.select({ tournamentId: playersToTournaments.tournamentId }).from(playersToTournaments).where(eq(playersToTournaments.playerId, targetId)),
    db.select({ tournamentId: tournamentPodiums.tournamentId, category: tournamentPodiums.category }).from(tournamentPodiums).where(eq(tournamentPodiums.playerId, sourceId)),
    db.select({ tournamentId: tournamentPodiums.tournamentId, category: tournamentPodiums.category }).from(tournamentPodiums).where(eq(tournamentPodiums.playerId, targetId)),
    db.select({ circuitId: circuitFinalPodiums.circuitId, category: circuitFinalPodiums.category }).from(circuitFinalPodiums).where(eq(circuitFinalPodiums.playerId, sourceId)),
    db.select({ circuitId: circuitFinalPodiums.circuitId, category: circuitFinalPodiums.category }).from(circuitFinalPodiums).where(eq(circuitFinalPodiums.playerId, targetId)),
    db.select({ ageGroup: tvSergipe.ageGroup, sex: tvSergipe.sex }).from(tvSergipe).where(eq(tvSergipe.playerId, sourceId)),
    db.select({ ageGroup: tvSergipe.ageGroup, sex: tvSergipe.sex }).from(tvSergipe).where(eq(tvSergipe.playerId, targetId)),
  ]);

  const conflicts: string[] = [];
  if (overlap(sourceResults.map((r) => key(r.tournamentId)), targetResults.map((r) => key(r.tournamentId))).length) {
    conflicts.push("both players have a rating result in the same tournament");
  }
  if (overlap(sourcePodiums.map((r) => key(r.tournamentId, r.category)), targetPodiums.map((r) => key(r.tournamentId, r.category))).length) {
    conflicts.push("both players have a podium in the same tournament and category");
  }
  if (overlap(sourceFinals.map((r) => key(r.circuitId, r.category)), targetFinals.map((r) => key(r.circuitId, r.category))).length) {
    conflicts.push("both players have a final podium in the same circuit and category");
  }
  if (overlap(sourceTv.map((r) => key(r.ageGroup, r.sex)), targetTv.map((r) => key(r.ageGroup, r.sex))).length) {
    conflicts.push("both players are in the same TV Sergipe age group");
  }
  return conflicts;
}

const RATING_TYPES = ["classic", "rapid", "blitz"] as const;

type Ratings = Record<(typeof RATING_TYPES)[number], number>;

async function planRatingChain(db: Database, playerIds: number[], fallback: Ratings) {
  const results = await db
    .select({
      id: playersToTournaments.id,
      ratingType: playersToTournaments.ratingType,
      oldRating: playersToTournaments.oldRating,
      variation: playersToTournaments.variation,
    })
    .from(playersToTournaments)
    .where(inArray(playersToTournaments.playerId, playerIds))
    .orderBy(asc(playersToTournaments.id));

  const ratings = { ...fallback };
  const rewrites = RATING_TYPES.flatMap((ratingType) => {
    const chain = results.filter((row) => row.ratingType === ratingType);
    const first = chain[0];
    if (!first) return [];
    let rating = first.oldRating;
    const updates = chain.flatMap((row) => {
      const update = row.oldRating === rating
        ? []
        : [db.update(playersToTournaments).set({ oldRating: rating }).where(eq(playersToTournaments.id, row.id))];
      rating += row.variation;
      return update;
    });
    ratings[ratingType] = rating;
    return updates;
  });
  return { ratings, rewrites };
}

export async function rebuildPlayerRatings(db: Database, input: { id: number }) {
  const [player] = await db.select().from(players).where(eq(players.id, input.id));
  if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });

  const { ratings, rewrites } = await planRatingChain(db, [input.id], {
    classic: player.classic,
    rapid: player.rapid,
    blitz: player.blitz,
  });
  await db.batch([db.update(players).set(ratings).where(eq(players.id, input.id)), ...rewrites]);
  return { id: input.id, ...ratings };
}

export async function mergePlayers(db: Database, input: { sourceId: number; targetId: number }) {
  if (input.sourceId === input.targetId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a different player to merge into" });
  }

  const targetId = Math.min(input.sourceId, input.targetId);
  const sourceId = Math.max(input.sourceId, input.targetId);

  const [[source], [target]] = await db.batch([
    db.select().from(players).where(eq(players.id, sourceId)),
    db.select().from(players).where(eq(players.id, targetId)),
  ]);
  if (!source || !target) throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });

  const conflicts = await findConflicts(db, sourceId, targetId);
  if (conflicts.length) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Cannot merge: ${conflicts.join("; ")}. Remove one of them first.`,
    });
  }

  const { ratings, rewrites } = await planRatingChain(db, [sourceId, targetId], {
    classic: target.classic,
    rapid: target.rapid,
    blitz: target.blitz,
  });

  const inherited = Object.fromEntries(
    PROFILE_FIELDS.filter((field) => target[field] == null && source[field] != null).map((field) => [field, source[field]]),
  );
  const moveUnlessOwned = <T extends typeof playersToTitles | typeof playersToRoles | typeof playersToNorms | typeof playersToInsignias | typeof defendingChampions>(
    table: T,
    otherKey: (t: T) => SQLiteColumn,
  ) => {
    const owned = alias(table, "owned");
    return db
      .update(table as typeof playersToTitles)
      .set({ playerId: targetId })
      .where(and(
        eq(table.playerId, sourceId),
        notExists(db.select({ id: owned.id }).from(owned).where(and(eq(owned.playerId, targetId), eq(otherKey(owned as T), otherKey(table))))),
      ));
  };

  await db.batch([
    db.update(players).set({ nickname: null, cbxId: null, fideId: null }).where(eq(players.id, sourceId)),
    db.update(players).set({
      ...inherited,
      active: target.active || source.active,
      verified: target.verified || source.verified,
      ...ratings,
    }).where(eq(players.id, targetId)),
    db.update(playersToTournaments).set({ playerId: targetId }).where(eq(playersToTournaments.playerId, sourceId)),
    ...rewrites,
    db.update(tournamentPodiums).set({ playerId: targetId }).where(eq(tournamentPodiums.playerId, sourceId)),
    db.update(circuitPodiums).set({ playerId: targetId }).where(eq(circuitPodiums.playerId, sourceId)),
    db.update(circuitFinalPodiums).set({ playerId: targetId }).where(eq(circuitFinalPodiums.playerId, sourceId)),
    db.update(cupPlayers).set({ playerId: targetId }).where(eq(cupPlayers.playerId, sourceId)),
    db.update(tvSergipe).set({ playerId: targetId }).where(eq(tvSergipe.playerId, sourceId)),
    db.update(announcements).set({ playerId: targetId }).where(eq(announcements.playerId, sourceId)),
    db.update(cupMatches).set({ playerOneId: targetId }).where(eq(cupMatches.playerOneId, sourceId)),
    db.update(cupMatches).set({ playerTwoId: targetId }).where(eq(cupMatches.playerTwoId, sourceId)),
    db.update(cupMatches).set({ winnerId: targetId }).where(eq(cupMatches.winnerId, sourceId)),
    db.update(cupGames).set({ winnerId: targetId }).where(eq(cupGames.winnerId, sourceId)),
    moveUnlessOwned(playersToTitles, (t) => t.titleId),
    moveUnlessOwned(playersToRoles, (t) => t.roleId),
    moveUnlessOwned(playersToNorms, (t) => t.normId),
    moveUnlessOwned(playersToInsignias, (t) => t.insigniaId),
    moveUnlessOwned(defendingChampions, (t) => t.championshipId),
    db.delete(defendingChampions).where(eq(defendingChampions.playerId, sourceId)),
    db.delete(players).where(eq(players.id, sourceId)),
  ]);

  return { id: targetId };
}
