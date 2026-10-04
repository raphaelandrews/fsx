import { and, count, desc, eq, gt, inArray } from "drizzle-orm";

import { players } from "@fsx/db/schema/players";
import { rankingSnapshots } from "@fsx/db/schema/rankingSnapshots";

import type { Context } from "../context";
import { RATING_TYPES, type RatingType } from "../routers/rating-update";

// Places gained since the previous snapshot (positive = up), "new" when the
// player was not ranked in it, null without two snapshots to compare.
export type Movement = number | "new" | null;

export interface FormatRanking {
  position: number;
  players: number;
  movement: Movement;
}

const latestTwo = (db: Context["db"], ratingType: RatingType) =>
  db
    .selectDistinct({ snapshotAt: rankingSnapshots.snapshotAt })
    .from(rankingSnapshots)
    .where(eq(rankingSnapshots.ratingType, ratingType))
    .orderBy(desc(rankingSnapshots.snapshotAt))
    .limit(2);

// Movement between the two latest snapshots of a format, which is the change
// the last rating import made; positions themselves are computed live.
export async function movementsFor(
  db: Context["db"],
  ratingType: RatingType,
  playerIds: number[],
  snapshots?: { snapshotAt: string }[],
): Promise<Map<number, Movement>> {
  const [latest, previous] = snapshots ?? (await latestTwo(db, ratingType));
  const movements = new Map<number, Movement>();
  if (!latest || !previous || playerIds.length === 0) return movements;
  const rows = await db
    .select({ playerId: rankingSnapshots.playerId, position: rankingSnapshots.position, snapshotAt: rankingSnapshots.snapshotAt })
    .from(rankingSnapshots)
    .where(
      and(
        eq(rankingSnapshots.ratingType, ratingType),
        inArray(rankingSnapshots.snapshotAt, [latest.snapshotAt, previous.snapshotAt]),
        inArray(rankingSnapshots.playerId, playerIds),
      ),
    );
  for (const playerId of playerIds) {
    const now = rows.find((row) => row.playerId === playerId && row.snapshotAt === latest.snapshotAt);
    const before = rows.find((row) => row.playerId === playerId && row.snapshotAt === previous.snapshotAt);
    movements.set(playerId, !now ? null : !before ? "new" : before.position - now.position);
  }
  return movements;
}

// Undefined for an unknown player; null per format for an inactive one.
export async function loadPlayerRanking(
  db: Context["db"],
  playerId: number,
): Promise<Record<RatingType, FormatRanking | null> | undefined> {
  const [[player], [ranked]] = await db.batch([
    db.query.players.findMany({
      where: eq(players.id, playerId),
      columns: { active: true, classic: true, rapid: true, blitz: true },
      limit: 1,
    }),
    db.select({ value: count() }).from(players).where(eq(players.active, true)),
  ]);
  if (!player) return undefined;
  if (!player.active) return { classic: null, rapid: null, blitz: null };

  // Position = active players rated higher + 1, so equal ratings share it.
  const above = (type: RatingType) =>
    db.select({ value: count() }).from(players).where(and(eq(players.active, true), gt(players[type], player[type])));
  const [[blitzAbove], [rapidAbove], [classicAbove], blitzSnapshots, rapidSnapshots, classicSnapshots] = await db.batch([
    above("blitz"),
    above("rapid"),
    above("classic"),
    latestTwo(db, "blitz"),
    latestTwo(db, "rapid"),
    latestTwo(db, "classic"),
  ]);
  const formats = {
    blitz: { above: blitzAbove?.value ?? 0, snapshots: blitzSnapshots },
    rapid: { above: rapidAbove?.value ?? 0, snapshots: rapidSnapshots },
    classic: { above: classicAbove?.value ?? 0, snapshots: classicSnapshots },
  };
  const movements = await Promise.all(
    RATING_TYPES.map((type) => movementsFor(db, type, [playerId], formats[type].snapshots)),
  );
  return Object.fromEntries(
    RATING_TYPES.map((type, index) => [
      type,
      {
        position: formats[type].above + 1,
        players: ranked?.value ?? 0,
        movement: movements[index]!.get(playerId) ?? null,
      },
    ]),
  ) as Record<RatingType, FormatRanking>;
}
