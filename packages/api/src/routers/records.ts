import { and, count, desc, eq, gte, inArray, lt, max, min, sql } from "drizzle-orm";

import { circuits } from "@fsx/db/schema/circuits";
import { clubs } from "@fsx/db/schema/clubs";
import { locations } from "@fsx/db/schema/locations";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/players-to-tournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { tournaments } from "@fsx/db/schema/tournaments";

import { RECORD_HOLDER_ID, allBadges, badgeCatalog, badgeHolders, type BadgeCatalogEntry } from "../gamification/badges";
import { storedOrComputed } from "../gamification/computed";
import { GAMIFICATION_LAUNCH_DATE, RATING_THRESHOLDS } from "../gamification/constants";
import { feedStart, recentFeed } from "../gamification/feed";
import { loadAllPlayerStats } from "../gamification/load";
import { playerRecords, recordHolders } from "../gamification/records";
import type { Context } from "../context";
import { publicProcedure, router } from "../index";
import { federationToday, federationYear } from "../lib/dates";
import { RATING_TYPES } from "../rating-types";

// Records and emblem rarity come from the same pass over every career, stored
// once per data change (computing every career exceeds the free plan's CPU).
function gamificationSummary(db: Context["db"]) {
  const year = federationYear();
  return storedOrComputed(db, `gamification:v3:${year}`, async () => {
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
    const stats = careers.map((career) => career.stats);
    return {
      records,
      badges: { ...badgeHolders(stats), recordHolders: recordHolders(records) },
      catalog: badgeCatalog(stats),
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
    .where(
      inArray(
        playersToTournaments.tournamentId,
        db.select({ id: tournaments.id }).from(tournaments).where(and(gte(tournaments.date, start), lt(tournaments.date, end))),
      ),
    )
    .orderBy(desc(playersToTournaments.variation), playersToTournaments.id)
    .limit(1);
  return best && best.variation > 0 ? { ...best, month: start.slice(0, 7) } : null;
}

async function siteStatistics(db: Context["db"]) {
  const thresholdSums = Object.fromEntries(
    RATING_TYPES.flatMap((format) =>
      RATING_THRESHOLDS.map((threshold) => {
        const key = `${format}${threshold}`;
        return [key, sql<number>`coalesce(sum(case when ${players[format]} >= ${threshold} then 1 else 0 end), 0)`.as(key)];
      }),
    ),
  );
  const [
    [playerCounts],
    [tournamentCounts],
    tournamentTiers,
    [thresholdCounts],
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
    db.select(thresholdSums).from(players).where(eq(players.active, true)),
  ]);

  const ratingsByThreshold = RATING_THRESHOLDS.map((threshold) => ({
    threshold,
    classic: thresholdCounts?.[`classic${threshold}`] ?? 0,
    rapid: thresholdCounts?.[`rapid${threshold}`] ?? 0,
    blitz: thresholdCounts?.[`blitz${threshold}`] ?? 0,
  }));

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
    const since = feedStart(GAMIFICATION_LAUNCH_DATE, federationToday());
    return since ? storedOrComputed(ctx.db, `feed:${since}`, () => recentFeed(ctx.db, since)) : [];
  }),
  all: publicProcedure.query(async ({ ctx }) => (await gamificationSummary(ctx.db)).records),
  statistics: publicProcedure.query(({ ctx }) => siteStatistics(ctx.db)),
  // Share of players holding each emblem, and who leads a record list.
  badges: publicProcedure.query(async ({ ctx }) => (await gamificationSummary(ctx.db)).badges),
  badgeStats: publicProcedure.query(async ({ ctx }) => {
    const { badges, catalog } = await gamificationSummary(ctx.db);
    const recordists = Object.keys(badges.recordHolders).length;
    // Every possible emblem (these win), plus those that only exist once earned (dynasties).
    const known = new Map<string, BadgeCatalogEntry>([...catalog, ...allBadges()].map((badge) => [badge.id, badge]));
    const entries: (BadgeCatalogEntry & { holders: number })[] = [...known.values()].map((badge) => ({
      ...badge,
      holders: badges.holders[badge.id] ?? 0,
    }));
    if (recordists > 0) {
      entries.push({
        id: RECORD_HOLDER_ID,
        family: "record",
        label: "Recordista",
        description: "Lidera algum dos recordes de /estatisticas, como maior rating, maior ganho ou mais títulos.",
        icon: "record",
        tier: "platinum",
        holders: recordists,
      });
    }
    return { players: badges.players, badges: entries.sort((a, b) => b.holders - a.holders || a.label.localeCompare(b.label, "pt-BR")) };
  }),
  monthHighlight: publicProcedure.query(({ ctx }) => monthHighlight(ctx.db, federationToday())),
});
