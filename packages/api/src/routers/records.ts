import { and, count, desc, eq, gte, lt, max, min, sql } from "drizzle-orm";

import { circuits } from "@fsx/db/schema/circuits";
import { clubs } from "@fsx/db/schema/clubs";
import { locations } from "@fsx/db/schema/locations";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournamentPodiums";
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

async function siteStatistics(db: Context["db"]) {
  const ratingThresholdCounts = (format: "classic" | "rapid" | "blitz") =>
    db
      .select({
        threshold2000: sql<number>`coalesce(sum(case when ${players[format]} >= 2000 then 1 else 0 end), 0)`,
        threshold2100: sql<number>`coalesce(sum(case when ${players[format]} >= 2100 then 1 else 0 end), 0)`,
        threshold2200: sql<number>`coalesce(sum(case when ${players[format]} >= 2200 then 1 else 0 end), 0)`,
        threshold2300: sql<number>`coalesce(sum(case when ${players[format]} >= 2300 then 1 else 0 end), 0)`,
        threshold2400: sql<number>`coalesce(sum(case when ${players[format]} >= 2400 then 1 else 0 end), 0)`,
      })
      .from(players)
      .where(eq(players.active, true));
  const [
    [playerCounts],
    [tournamentCounts],
    tournamentTiers,
    [classicRatings],
    [rapidRatings],
    [blitzRatings],
  ] = await db.batch([
    db
      .select({
        total: count(),
        active: sql<number>`coalesce(sum(case when ${players.active} = 1 then 1 else 0 end), 0)`,
        femaleActive: sql<number>`coalesce(sum(case when ${players.active} = 1 and ${players.sex} = 'female' then 1 else 0 end), 0)`,
        citiesRepresented: sql<number>`count(distinct case when ${players.active} = 1 and ${locations.type} = 'city' then ${players.locationId} end)`,
      })
      .from(players)
      .leftJoin(locations, eq(players.locationId, locations.id)),
    db
      .select({
        total: count(),
        firstDate: min(tournaments.date),
        lastDate: max(tournaments.date),
        ratingResults: sql<number>`(select count(*) from ${playersToTournaments})`,
        tournamentPodiums: sql<number>`(select count(*) from ${tournamentPodiums})`,
        clubs: sql<number>`(select count(*) from ${clubs})`,
        completedCircuits: sql<number>`(select count(*) from ${circuits} where ${circuits.finishedAt} is not null)`,
      })
      .from(tournaments),
    db
      .select({ tier: tournaments.tier, tournaments: count() })
      .from(tournaments)
      .groupBy(tournaments.tier)
      .orderBy(tournaments.tier),
    ratingThresholdCounts("classic"),
    ratingThresholdCounts("rapid"),
    ratingThresholdCounts("blitz"),
  ]);

  const ratingsByThreshold = [
    { threshold: 2000, classic: classicRatings?.threshold2000 ?? 0, rapid: rapidRatings?.threshold2000 ?? 0, blitz: blitzRatings?.threshold2000 ?? 0 },
    { threshold: 2100, classic: classicRatings?.threshold2100 ?? 0, rapid: rapidRatings?.threshold2100 ?? 0, blitz: blitzRatings?.threshold2100 ?? 0 },
    { threshold: 2200, classic: classicRatings?.threshold2200 ?? 0, rapid: rapidRatings?.threshold2200 ?? 0, blitz: blitzRatings?.threshold2200 ?? 0 },
    { threshold: 2300, classic: classicRatings?.threshold2300 ?? 0, rapid: rapidRatings?.threshold2300 ?? 0, blitz: blitzRatings?.threshold2300 ?? 0 },
    { threshold: 2400, classic: classicRatings?.threshold2400 ?? 0, rapid: rapidRatings?.threshold2400 ?? 0, blitz: blitzRatings?.threshold2400 ?? 0 },
  ];

  return {
    players: {
      total: playerCounts?.total ?? 0,
      active: playerCounts?.active ?? 0,
      femaleActive: playerCounts?.femaleActive ?? 0,
    },
    tournaments: {
      total: tournamentCounts?.total ?? 0,
      firstDate: tournamentCounts?.firstDate ?? null,
      lastDate: tournamentCounts?.lastDate ?? null,
    },
    ratingsByThreshold,
    tournamentsByTier: tournamentTiers.map(({ tier, tournaments }) => ({ tier, tournaments })),
    ratingResults: tournamentCounts?.ratingResults ?? 0,
    tournamentPodiums: tournamentCounts?.tournamentPodiums ?? 0,
    clubs: tournamentCounts?.clubs ?? 0,
    citiesRepresented: playerCounts?.citiesRepresented ?? 0,
    completedCircuits: tournamentCounts?.completedCircuits ?? 0,
  };
}

export const recordsRouter = router({
  recent: publicProcedure.query(({ ctx }) => {
    const since = feedStart(GAMIFICATION_LAUNCH_DATE, today());
    return since ? storedOrComputed(ctx.db, `feed:${since}`, () => recentFeed(ctx.db, since)) : [];
  }),
  all: publicProcedure.query(async ({ ctx }) => (await gamificationSummary(ctx.db)).records),
  statistics: publicProcedure.query(({ ctx }) => siteStatistics(ctx.db)),
  // Share of players holding each emblem, and who leads a record list.
  badges: publicProcedure.query(async ({ ctx }) => (await gamificationSummary(ctx.db)).badges),
  monthHighlight: publicProcedure.query(({ ctx }) => monthHighlight(ctx.db, today())),
});
