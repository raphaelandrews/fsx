import { and, count, eq, inArray, sql } from "drizzle-orm";

import { players } from "@fsx/db/schema/players";
import { rankingSnapshots } from "@fsx/db/schema/ranking-snapshots";

import type { Context } from "../context";
import { RATING_TYPES, type RatingType } from "../rating-types";

// Places gained since the previous snapshot (positive = up), "new" when the
// player was not ranked in it, null without two snapshots to compare.
export type Movement = number | "new" | null;

export interface FormatRanking {
  position: number;
  players: number;
  movement: Movement;
  female?: { position: number; players: number };
}

// Two index probes, not DISTINCT ... LIMIT 2: that scans every row of the latest
// snapshot (one per ranked player) before it can see the second date.
const latestTwo = (db: Context["db"], ratingType: RatingType) => {
  const latest = sql`(select max(${rankingSnapshots.snapshotAt}) from ${rankingSnapshots} where ${rankingSnapshots.ratingType} = ${ratingType})`;
  return db
    .select({
      latest: sql<string | null>`${latest}`,
      previous: sql<string | null>`(select max(${rankingSnapshots.snapshotAt}) from ${rankingSnapshots} where ${rankingSnapshots.ratingType} = ${ratingType} and ${rankingSnapshots.snapshotAt} < ${latest})`,
    })
    .from(sql`(select 1)`);
};

const snapshotsOf = (rows: { latest: string | null; previous: string | null }[]) =>
  [rows[0]?.latest, rows[0]?.previous].flatMap((snapshotAt) => (snapshotAt ? [{ snapshotAt }] : []));

// Movement between the two latest snapshots of a format, which is the change
// the last rating import made; positions themselves are computed live.
export async function movementsFor(
  db: Context["db"],
  ratingType: RatingType,
  playerIds: number[],
  snapshots?: { snapshotAt: string }[],
): Promise<Map<number, Movement>> {
  const [latest, previous] = snapshots ?? snapshotsOf(await latestTwo(db, ratingType));
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
  const [player] = await db.query.players.findMany({
    where: eq(players.id, playerId),
    columns: { active: true, sex: true, classic: true, rapid: true, blitz: true },
    limit: 1,
  });
  if (!player) return undefined;
  if (!player.active) return { classic: null, rapid: null, blitz: null };

  // Position = active players rated higher + 1, so equal ratings share it. One
  // pass over the covering index answers the overall and the women's ranking.
  const above = (type: RatingType, female = false) =>
    sql<number>`coalesce(sum(case when ${players[type]} > ${player[type]}${female ? sql` and ${players.sex} = 'female'` : sql``} then 1 else 0 end), 0)`;
  const [[totals], blitzSnapshots, rapidSnapshots, classicSnapshots] = await db.batch([
    db
      .select({
        players: count(),
        blitzAbove: above("blitz"),
        rapidAbove: above("rapid"),
        classicAbove: above("classic"),
        femalePlayers: sql<number>`coalesce(sum(case when ${players.sex} = 'female' then 1 else 0 end), 0)`,
        femaleBlitzAbove: above("blitz", true),
        femaleRapidAbove: above("rapid", true),
        femaleClassicAbove: above("classic", true),
      })
      .from(players)
      .where(eq(players.active, true)),
    latestTwo(db, "blitz"),
    latestTwo(db, "rapid"),
    latestTwo(db, "classic"),
  ]);
  const formats = {
    blitz: { above: totals?.blitzAbove ?? 0, snapshots: snapshotsOf(blitzSnapshots) },
    rapid: { above: totals?.rapidAbove ?? 0, snapshots: snapshotsOf(rapidSnapshots) },
    classic: { above: totals?.classicAbove ?? 0, snapshots: snapshotsOf(classicSnapshots) },
  };
  const movements = await Promise.all(
    RATING_TYPES.map((type) => movementsFor(db, type, [playerId], formats[type].snapshots)),
  );
  const femaleAbove: Record<RatingType, number> | null =
    player.sex === "female" && totals
      ? { blitz: totals.femaleBlitzAbove, rapid: totals.femaleRapidAbove, classic: totals.femaleClassicAbove }
      : null;
  return Object.fromEntries(
    RATING_TYPES.map((type, index) => [
      type,
      {
        position: formats[type].above + 1,
        players: totals?.players ?? 0,
        movement: movements[index]!.get(playerId) ?? null,
        ...(femaleAbove && totals
          ? { female: { position: femaleAbove[type] + 1, players: totals.femalePlayers } }
          : {}),
      },
    ]),
  ) as Record<RatingType, FormatRanking>;
}
