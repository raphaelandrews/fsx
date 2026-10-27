import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, eq, gte, lt, sql } from "drizzle-orm";

import { clubs } from "@fsx/db/schema/clubs";
import { players } from "@fsx/db/schema/players";
import { rankingSnapshots } from "@fsx/db/schema/ranking-snapshots";
import type { Context } from "../context";
import { publicProcedure, router } from "../index";
import { isoDate, page, ratingTypeSchema } from "../input-schemas";
import { federationDayBounds, federationDayOf } from "../lib/dates";
import { paginate } from "../lib/pagination";
import type { RatingType } from "../rating-types";

export const SNAPSHOT_LIST_PAGE_SIZE = 50;
const ARCHIVE_SNAPSHOTS_LIMIT = 150;

// Walks the (rating_type, snapshot_at) index one snapshot at a time, newest first, so the cost follows the
// number of imports instead of the number of ranked players in each.
const recentSnapshotTimes = async (db: Context["db"], ratingType: RatingType) => {
  const rows = await db.all<{ at: string }>(sql`
    WITH RECURSIVE s(at) AS (
      SELECT max(snapshot_at) FROM ranking_snapshots WHERE rating_type = ${ratingType}
      UNION ALL
      SELECT (SELECT max(snapshot_at) FROM ranking_snapshots WHERE rating_type = ${ratingType} AND snapshot_at < s.at)
      FROM s WHERE s.at IS NOT NULL
    )
    SELECT at FROM s WHERE at IS NOT NULL LIMIT ${ARCHIVE_SNAPSHOTS_LIMIT}
  `);
  return rows.map((row) => row.at);
};

// Several imports can land on one day; the last one of the day is that day's list.
const snapshotOfDay = async (db: Context["db"], ratingType: RatingType, date: string) => {
  const { start, end } = federationDayBounds(date);
  const [row] = await db
    .select({ at: sql<string | null>`max(${rankingSnapshots.snapshotAt})` })
    .from(rankingSnapshots)
    .where(
      and(
        eq(rankingSnapshots.ratingType, ratingType),
        gte(rankingSnapshots.snapshotAt, start),
        lt(rankingSnapshots.snapshotAt, end),
      ),
    );
  return row?.at ?? null;
};

export const ratingsRouter = router({
  // Days with a recorded rating list, newest first. The archive starts at the first import after snapshots began.
  lists: publicProcedure.input(z.object({ ratingType: ratingTypeSchema })).query(async ({ ctx, input }) => {
    const times = await recentSnapshotTimes(ctx.db, input.ratingType);
    return { dates: [...new Set(times.map(federationDayOf))] };
  }),
  snapshot: publicProcedure
    .input(z.object({ date: isoDate, ratingType: ratingTypeSchema, page }))
    .query(async ({ ctx, input }) => {
      const at = await snapshotOfDay(ctx.db, input.ratingType, input.date);
      if (!at) throw new TRPCError({ code: "NOT_FOUND", message: "No rating list was recorded on that date" });
      const where = and(eq(rankingSnapshots.ratingType, input.ratingType), eq(rankingSnapshots.snapshotAt, at));
      const [rows, totals] = await ctx.db.batch([
        ctx.db
          .select({
            playerId: players.id,
            playerName: sql<string>`${players.name}`.as("player_name"),
            clubName: sql<string | null>`${clubs.name}`.as("club_name"),
            position: rankingSnapshots.position,
            rating: rankingSnapshots.rating,
          })
          .from(rankingSnapshots)
          .innerJoin(players, eq(players.id, rankingSnapshots.playerId))
          .leftJoin(clubs, eq(clubs.id, players.clubId))
          .where(where)
          .orderBy(asc(rankingSnapshots.position), asc(players.name), asc(players.id))
          .limit(SNAPSHOT_LIST_PAGE_SIZE)
          .offset((input.page - 1) * SNAPSHOT_LIST_PAGE_SIZE),
        ctx.db.select({ value: count() }).from(rankingSnapshots).where(where),
      ]);
      return {
        date: input.date,
        ratingType: input.ratingType,
        players: rows.map(({ playerId, playerName, clubName, position, rating }) => ({
          id: playerId,
          name: playerName,
          club: clubName,
          position,
          rating,
        })),
        pagination: paginate({ page: input.page, perPage: SNAPSHOT_LIST_PAGE_SIZE, totalItems: totals[0]?.value ?? 0 }),
      };
    }),
});
