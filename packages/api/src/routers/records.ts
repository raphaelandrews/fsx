import { and, desc, eq, gte, lt } from "drizzle-orm";

import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { tournaments } from "@fsx/db/schema/tournaments";

import { badgeHolders } from "../gamification/badges";
import { storedOrComputed } from "../gamification/computed";
import { GAMIFICATION_LAUNCH_DATE } from "../gamification/constants";
import { feedStart, recentFeed } from "../gamification/feed";
import { loadAllPlayerStats } from "../gamification/load";
import { playerRecords, recordHolders } from "../gamification/records";
import type { Context } from "../context";
import { publicProcedure, router } from "../index";

// The federation's calendar day and year, not UTC's, around midnight.
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const currentYear = () => Number(today().slice(0, 4));

// Records and emblem rarity come from the same pass over every career, stored
// once per data change (computing every career exceeds the free plan's CPU).
function gamificationSummary(db: Context["db"]) {
  const year = currentYear();
  return storedOrComputed(db, `gamification:${year}`, async () => {
    const careers = await loadAllPlayerStats(db);
    const records = playerRecords(
      careers.map(({ player, stats, level, tournaments }) => ({
        player: { id: player.id, name: player.name, nickname: player.nickname, active: player.active },
        stats,
        level,
        tournaments,
      })),
      year,
    );
    return {
      records,
      badges: { ...badgeHolders(careers.map((career) => career.stats)), recordHolders: recordHolders(records) },
    };
  });
}

// Next month's first day, for a half-open [start, end) range on ISO dates.
const monthRange = (day: string) => {
  const [year, month] = day.split("-").map(Number) as [number, number];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, end };
};

export async function monthHighlight(db: Context["db"], day: string) {
  const { start, end } = monthRange(day);
  const [best] = await db
    .select({
      variation: playersToTournaments.variation,
      ratingType: playersToTournaments.ratingType,
      player: { id: players.id, name: players.name, nickname: players.nickname },
      tournament: { id: tournaments.id, name: tournaments.name, date: tournaments.date },
    })
    .from(playersToTournaments)
    .innerJoin(tournaments, eq(tournaments.id, playersToTournaments.tournamentId))
    .innerJoin(players, eq(players.id, playersToTournaments.playerId))
    .where(and(gte(tournaments.date, start), lt(tournaments.date, end)))
    .orderBy(desc(playersToTournaments.variation), playersToTournaments.id)
    .limit(1);
  return best && best.variation > 0 ? { ...best, month: start.slice(0, 7) } : null;
}

export const recordsRouter = router({
  recent: publicProcedure.query(({ ctx }) => {
    const since = feedStart(GAMIFICATION_LAUNCH_DATE, today());
    return since ? storedOrComputed(ctx.db, `feed:${since}`, () => recentFeed(ctx.db, since)) : [];
  }),
  all: publicProcedure.query(async ({ ctx }) => (await gamificationSummary(ctx.db)).records),
  // Share of players holding each emblem, and who leads a record list.
  badges: publicProcedure.query(async ({ ctx }) => (await gamificationSummary(ctx.db)).badges),
  monthHighlight: publicProcedure.query(({ ctx }) => monthHighlight(ctx.db, today())),
});
