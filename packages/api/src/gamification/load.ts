import { and, asc, eq, inArray, isNotNull, type SQL } from "drizzle-orm";

import { circuitFinalPodiums } from "@fsx/db/schema/circuitFinalPodiums";
import { circuitPhases } from "@fsx/db/schema/circuitPhases";
import { circuitPodiums } from "@fsx/db/schema/circuitPodiums";
import { players } from "@fsx/db/schema/players";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournamentPodiums";

import type { CompetitionTier } from "../circuit-types";
import type { Context } from "../context";
import type { RatingType } from "../routers/rating-update";
import { achievementsOf, nextMilestone, upcomingOf } from "./badges";
import { PLAYER_RESULTS_LIMIT, STARTING_RATING } from "./constants";
import { playerLevel, type LevelInput } from "./level";
import { playerStats, type Competition, type StatsInput } from "./stats";
import { titlePath } from "./title-path";

// Every career at once (records, clubs). Far above today's 8.5k results.
const ALL_CAREERS_LIMIT = 100_000;

type CompetitionRow = {
  id: number;
  name: string;
  date: string | null;
  tier: string;
  championshipId: number | null;
  championship: { name: string } | null;
};

const competition = (row: CompetitionRow): Competition => ({
  id: row.id,
  name: row.name,
  date: row.date,
  tier: row.tier as CompetitionTier,
  championshipId: row.championshipId,
  championshipName: row.championship?.name ?? null,
});

// The same queries serve one player (profile) and every player (records), so
// both paths feed identical rows to the stats module. Tournaments are read once
// and joined in memory: a nested relation per result row read each tournament
// and championship again for every row.
// `scope`: one player id (profile), several (feed), or every player (records).
function careerQueries(db: Context["db"], scope?: number | number[]) {
  const only = (column: Parameters<typeof eq>[0]): SQL | undefined =>
    scope === undefined ? undefined : typeof scope === "number" ? eq(column, scope) : inArray(column, scope);
  const limit = typeof scope === "number" ? PLAYER_RESULTS_LIMIT : ALL_CAREERS_LIMIT;
  // findMany, not findFirst: drizzle's batch crashes mapping a findFirst that matches nothing.
  return [
    db.query.players.findMany({
      where: only(players.id),
      columns: { id: true, name: true, nickname: true, active: true, classic: true, rapid: true, blitz: true, sex: true, birthDate: true },
      limit: typeof scope === "number" ? 1 : ALL_CAREERS_LIMIT,
    }),
    db.query.playersToTournaments.findMany({
      where: only(playersToTournaments.playerId),
      columns: { id: true, playerId: true, tournamentId: true, ratingType: true, oldRating: true, variation: true },
      orderBy: asc(playersToTournaments.id),
      limit,
    }),
    db.query.tournamentPodiums.findMany({
      where: only(tournamentPodiums.playerId),
      columns: { playerId: true, tournamentId: true, place: true, category: true },
      limit,
    }),
    db.query.circuitPodiums.findMany({
      where: and(only(circuitPodiums.playerId), isNotNull(circuitPodiums.circuitPhaseId)),
      columns: { playerId: true, place: true, category: true },
      limit,
      with: {
        circuitPhases: {
          columns: { tournamentId: true },
          with: {
            tournament: { columns: { name: true, date: true } },
            circuit: { columns: { id: true, name: true } },
          },
        },
      },
    }),
    db.query.circuitFinalPodiums.findMany({
      where: only(circuitFinalPodiums.playerId),
      columns: { playerId: true, place: true, category: true },
      limit,
      with: {
        circuit: {
          columns: { id: true, name: true, tier: true, year: true, finishedAt: true, championshipId: true },
          with: { championship: { columns: { name: true } } },
        },
      },
    }),
    db.query.playersToTitles.findMany({
      where: only(playersToTitles.playerId),
      columns: { playerId: true },
      limit,
      with: { title: { columns: { tier: true, shortName: true } } },
    }),
    db.query.tournaments.findMany({
      columns: { id: true, name: true, date: true, tier: true, championshipId: true },
      limit: ALL_CAREERS_LIMIT,
      with: { championship: { columns: { name: true } } },
    }),
    db.select({ circuitId: circuitPhases.circuitId }).from(circuitPhases).limit(ALL_CAREERS_LIMIT),
  ] as const;
}

type CareerRows = Awaited<ReturnType<typeof loadCareerRows>>;

export async function loadCareerRows(db: Context["db"], scope?: number | number[]) {
  const [people, results, podiums, stages, finals, titles, events, phases] = await db.batch(careerQueries(db, scope));
  return { people, results, podiums, stages, finals, titles, events, phases };
}

export type CareerPlayer = CareerRows["people"][number];

export interface Career {
  player: CareerPlayer;
  input: StatsInput & LevelInput;
  titleShortNames: string[];
  tournaments: Record<number, { name: string; date: string | null }>;
}

function careers(rows: CareerRows): Map<number, Career> {
  const byId = new Map(rows.events.map((row) => [row.id, competition(row)]));
  const stageCounts = new Map<number, number>();
  for (const { circuitId } of rows.phases) stageCounts.set(circuitId, (stageCounts.get(circuitId) ?? 0) + 1);
  const byPlayer = new Map<number, Career>();
  for (const player of rows.people) {
    byPlayer.set(player.id, {
      player,
      input: {
        ratings: { classic: player.classic, rapid: player.rapid, blitz: player.blitz },
        results: [],
        tournamentPodiums: [],
        circuitStageResults: [],
        circuitFinalPodiums: [],
        titleTiers: [],
      },
      titleShortNames: [],
      tournaments: {},
    });
  }
  for (const row of rows.results) {
    const career = byPlayer.get(row.playerId);
    const tournament = byId.get(row.tournamentId);
    if (!career || !tournament) continue;
    career.input.results.push({
      id: row.id,
      ratingType: row.ratingType as RatingType,
      oldRating: row.oldRating,
      variation: row.variation,
      tournament,
    });
    career.tournaments[tournament.id] = { name: tournament.name, date: tournament.date };
  }
  for (const row of rows.podiums) {
    const career = byPlayer.get(row.playerId);
    const tournament = byId.get(row.tournamentId);
    if (!career || !tournament) continue;
    career.input.tournamentPodiums.push({ place: row.place, category: row.category, tournament });
    career.tournaments[tournament.id] = { name: tournament.name, date: tournament.date };
  }
  for (const row of rows.stages) {
    const career = byPlayer.get(row.playerId);
    if (!career || !row.circuitPhases) continue;
    career.input.circuitStageResults.push({
      place: row.place,
      category: row.category,
      tournamentId: row.circuitPhases.tournamentId,
      date: row.circuitPhases.tournament.date,
      circuit: { ...row.circuitPhases.circuit, stages: stageCounts.get(row.circuitPhases.circuit.id) ?? 0 },
    });
    career.tournaments[row.circuitPhases.tournamentId] = row.circuitPhases.tournament;
  }
  for (const row of rows.finals) {
    byPlayer.get(row.playerId)?.input.circuitFinalPodiums.push({
      place: row.place,
      category: row.category,
      circuit: { ...competition({ ...row.circuit, date: row.circuit.finishedAt }), year: row.circuit.year },
    });
  }
  for (const row of rows.titles) {
    const career = byPlayer.get(row.playerId);
    career?.input.titleTiers.push(row.title.tier);
    career?.titleShortNames.push(row.title.shortName);
  }
  return byPlayer;
}

// One D1 round trip for a player's whole career. Undefined for an unknown
// player, so callers can raise NOT_FOUND.
export async function loadPlayerCareer(db: Context["db"], playerId: number): Promise<Career | undefined> {
  return careers(await loadCareerRows(db, playerId)).get(playerId);
}

export async function loadPlayerStats(db: Context["db"], playerId: number) {
  const career = await loadPlayerCareer(db, playerId);
  if (!career) return undefined;
  const stats = playerStats(career.input);
  const upcoming = upcomingOf(stats);
  // The federation's year, not UTC's, for youth title ages around New Year.
  const year = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(new Date()));
  return {
    stats,
    level: playerLevel(career.input, stats),
    achievements: achievementsOf(stats),
    upcoming,
    nextMilestone: nextMilestone(upcoming),
    titlePath: titlePath({
      stats,
      podiums: career.input.tournamentPodiums,
      sex: career.player.sex,
      birthDate: career.player.birthDate,
      heldShortNames: career.titleShortNames,
      year,
    }),
    tournaments: career.tournaments,
  };
}

const hasCareer = ({ input }: Career) =>
  input.results.length > 0 ||
  input.tournamentPodiums.length > 0 ||
  input.circuitStageResults.length > 0 ||
  input.circuitFinalPodiums.length > 0 ||
  input.titleTiers.length > 0 ||
  Object.values(input.ratings).some((rating) => rating !== STARTING_RATING);

// Every player with something to rank, computed exactly as on the profile.
// Players with no history and the starting ratings have empty stats.
export function allPlayerStats(rows: CareerRows) {
  return [...careers(rows).values()].filter(hasCareer).map((career) => {
    const stats = playerStats(career.input);
    return { player: career.player, stats, level: playerLevel(career.input, stats), tournaments: career.tournaments };
  });
}

export async function loadAllPlayerStats(db: Context["db"], scope?: number[]) {
  return allPlayerStats(await loadCareerRows(db, scope));
}
