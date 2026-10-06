import type { CompetitionTier } from "../circuit-types";
import { RATING_TYPES, type RatingType } from "../routers/rating-update";
import { COMEBACK_AFTER, DECADE_YEARS, GAIN_STEPS, POSITIVE_STREAK_STEPS, RATING_THRESHOLDS, STARTING_RATING } from "./constants";

// Implements the Data rules of GAMIFICATION.md. Pure: callers load the rows.

export interface Competition {
  id: number;
  name: string;
  date: string | null;
  tier: CompetitionTier;
  championshipId: number | null;
  championshipName: string | null;
}

export interface RatingResult {
  id: number;
  ratingType: RatingType;
  oldRating: number;
  variation: number;
  tournament: Competition;
}

export interface TournamentPodium {
  place: number;
  category: string | null;
  tournament: Competition;
}

export interface CircuitStageResult {
  place: number | null;
  category: string | null;
  tournamentId: number;
  date: string | null;
  // `stages`: how many stages the circuit season has, for "Circuito completo".
  circuit: { id: number; name: string; stages: number };
}

export interface CircuitFinalPodium {
  place: number;
  category: string | null;
  circuit: Competition & { year: number | null };
}

export interface StatsInput {
  ratings: Record<RatingType, number>;
  results: RatingResult[];
  tournamentPodiums: TournamentPodium[];
  circuitStageResults: CircuitStageResult[];
  circuitFinalPodiums: CircuitFinalPodium[];
}

// Where an achievement came from. `legacy`: earned before the recorded history
// began. `earnedAt: null` without legacy: the date is unknown (gap, manual edit,
// undated tournament). Never an invented date.
export interface Provenance {
  earnedAt: string | null;
  tournamentId: number | null;
  legacy: boolean;
}

export interface FormatStats {
  results: number;
  peak: { rating: number } & Provenance;
  bestGain: ({ variation: number } & Provenance) | null;
  currentStreak: number;
  bestStreak: number;
  thresholds: ({ threshold: number } & Provenance)[];
  streakSteps: ({ length: number } & Provenance)[];
  // First result reaching each GAIN_STEPS gain, and the first gain after a run of
  // COMEBACK_AFTER results without one.
  gainSteps: ({ step: number } & Provenance)[];
  comeback: Provenance | null;
}

export interface Medals {
  gold: number;
  silver: number;
  bronze: number;
}

export interface Dynasty {
  championshipId: number;
  championshipName: string;
  wins: ({ year: number | null } & Provenance)[];
  longestRun: { length: number; endYear: number | null };
}

export interface PlayerStats {
  tournamentsPlayed: number;
  // Dated tournaments in chronological order, then undated ones.
  played: { tournamentId: number; date: string | null }[];
  seasons: number[];
  tournamentsByYear: Record<number, number>;
  formats: Record<RatingType, FormatStats | null>;
  medals: {
    tournament: Medals;
    tournamentCategory: Medals;
    circuitFinal: Medals;
    circuitStage: Medals;
  };
  dynasties: Dynasty[];
  firsts: {
    tournament: Provenance | null;
    positiveResult: Provenance | null;
    podium: Provenance | null;
  };
  // First dated tournament of each season, in order (Veterano).
  seasonStarts: Provenance[];
  // When a single year first had results in all three formats (Tríplice).
  allFormatsInYear: Provenance | null;
  // Circuit stage podiums (place 1–3), in date order (Pódio de etapa).
  stagePodiums: Provenance[];
  // Circuit seasons where the player played every stage (Circuito completo).
  completeCircuits: ({ circuitId: number; name: string } & Provenance)[];
  // First win per tournament category (Campeão de categoria).
  categoryWins: ({ category: string } & Provenance)[];
  // First result DECADE_YEARS or more after the first dated tournament (Década).
  decade: Provenance | null;
}

const UNKNOWN: Provenance = { earnedAt: null, tournamentId: null, legacy: false };
const LEGACY: Provenance = { earnedAt: null, tournamentId: null, legacy: true };

const at = (tournament: { id: number; date: string | null }): Provenance => ({
  earnedAt: tournament.date,
  tournamentId: tournament.id,
  legacy: false,
});

const yearOf = (date: string | null) => (date ? Number(date.slice(0, 4)) : null);

// Dated first, chronologically; undated last. Ties keep input order.
const byDate = (a: string | null, b: string | null) =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : a < b ? -1 : 1;

export function playerStats(input: StatsInput): PlayerStats {
  const played = [...playedTournaments(input)]
    .map(([tournamentId, date]) => ({ tournamentId, date }))
    .sort((a, b) => byDate(a.date, b.date));
  const tournamentsByYear: Record<number, number> = {};
  for (const { date } of played) {
    const year = yearOf(date);
    if (year !== null) tournamentsByYear[year] = (tournamentsByYear[year] ?? 0) + 1;
  }

  const formats = Object.fromEntries(
    RATING_TYPES.map((type) => [
      type,
      formatStats(
        input.results.filter((result) => result.ratingType === type).sort((a, b) => a.id - b.id),
        input.ratings[type],
      ),
    ]),
  ) as Record<RatingType, FormatStats | null>;

  return {
    tournamentsPlayed: played.length,
    played,
    seasons: Object.keys(tournamentsByYear).map(Number).sort((a, b) => a - b),
    tournamentsByYear,
    formats,
    medals: {
      tournament: medals(input.tournamentPodiums.filter((podium) => podium.category === null)),
      tournamentCategory: medals(input.tournamentPodiums.filter((podium) => podium.category !== null)),
      circuitFinal: medals(input.circuitFinalPodiums),
      circuitStage: medals(input.circuitStageResults),
    },
    dynasties: dynasties(input),
    firsts: firsts(input, played[0]),
    seasonStarts: seasonStarts(played),
    allFormatsInYear: allFormatsInYear(input.results),
    stagePodiums: input.circuitStageResults
      .filter((stage) => stage.place !== null && stage.place <= 3)
      .map((stage) => at({ id: stage.tournamentId, date: stage.date }))
      .sort((a, b) => byDate(a.earnedAt, b.earnedAt)),
    completeCircuits: completeCircuits(input.circuitStageResults),
    categoryWins: categoryWins(input.tournamentPodiums),
    decade: decade(played),
  };
}

function seasonStarts(played: PlayerStats["played"]): Provenance[] {
  const seen = new Set<number>();
  const starts: Provenance[] = [];
  for (const entry of played) {
    const year = yearOf(entry.date);
    if (year === null || seen.has(year)) continue;
    seen.add(year);
    starts.push(at({ id: entry.tournamentId, date: entry.date }));
  }
  return starts;
}

function allFormatsInYear(results: RatingResult[]): Provenance | null {
  const byYear = new Map<number, Map<RatingType, RatingResult>>();
  for (const result of results) {
    const year = yearOf(result.tournament.date);
    if (year === null) continue;
    const formats = byYear.get(year) ?? new Map<RatingType, RatingResult>();
    const current = formats.get(result.ratingType);
    if (!current || byDate(result.tournament.date, current.tournament.date) < 0) formats.set(result.ratingType, result);
    byYear.set(year, formats);
  }
  const years = [...byYear.entries()]
    .filter(([, formats]) => formats.size === RATING_TYPES.length)
    .sort(([a], [b]) => a - b);
  if (years.length === 0) return null;
  // The trio completes with the latest of the three first results that year.
  const completing = [...years[0]![1].values()].sort((a, b) => byDate(b.tournament.date, a.tournament.date))[0]!;
  return at(completing.tournament);
}

function completeCircuits(stages: CircuitStageResult[]): PlayerStats["completeCircuits"] {
  const byCircuit = new Map<number, { circuit: CircuitStageResult["circuit"]; tournaments: Map<number, string | null> }>();
  for (const stage of stages) {
    const entry = byCircuit.get(stage.circuit.id) ?? { circuit: stage.circuit, tournaments: new Map() };
    entry.tournaments.set(stage.tournamentId, stage.date);
    byCircuit.set(stage.circuit.id, entry);
  }
  return [...byCircuit.values()]
    .filter(({ circuit, tournaments }) => circuit.stages > 0 && tournaments.size >= circuit.stages)
    .map(({ circuit, tournaments }) => {
      const [tournamentId, date] = [...tournaments].sort((a, b) => byDate(b[1], a[1]))[0]!;
      return { circuitId: circuit.id, name: circuit.name, ...at({ id: tournamentId, date }) };
    })
    .sort((a, b) => byDate(a.earnedAt, b.earnedAt));
}

function categoryWins(podiums: TournamentPodium[]): PlayerStats["categoryWins"] {
  const wins = new Map<string, Provenance>();
  for (const podium of [...podiums].sort((a, b) => byDate(a.tournament.date, b.tournament.date))) {
    if (podium.place !== 1 || podium.category === null || wins.has(podium.category)) continue;
    wins.set(podium.category, at(podium.tournament));
  }
  return [...wins].map(([category, provenance]) => ({ category, ...provenance }));
}

function decade(played: PlayerStats["played"]): Provenance | null {
  const first = played.find((entry) => entry.date !== null);
  if (!first) return null;
  const target = `${Number(first.date!.slice(0, 4)) + DECADE_YEARS}${first.date!.slice(4, 10)}`;
  const reached = played.find((entry) => entry.date !== null && entry.date.slice(0, 10) >= target);
  return reached ? at({ id: reached.tournamentId, date: reached.date }) : null;
}

// Tournaments played = rating results ∪ tournament podiums ∪ circuit stages,
// since old tournaments are often recorded only through their podiums.
function playedTournaments(input: StatsInput): Map<number, string | null> {
  const played = new Map<number, string | null>();
  for (const { tournament } of input.results) played.set(tournament.id, tournament.date);
  for (const { tournament } of input.tournamentPodiums) played.set(tournament.id, tournament.date);
  for (const stage of input.circuitStageResults) {
    if (!played.has(stage.tournamentId)) played.set(stage.tournamentId, stage.date);
  }
  return played;
}

function formatStats(chain: RatingResult[], current: number): FormatStats | null {
  if (chain.length === 0) {
    if (current === STARTING_RATING) return null;
    return {
      results: 0,
      peak: { rating: current, ...LEGACY },
      bestGain: null,
      currentStreak: 0,
      bestStreak: 0,
      thresholds: RATING_THRESHOLDS.filter((threshold) => current >= threshold).map((threshold) => ({
        threshold,
        ...LEGACY,
      })),
      streakSteps: [],
      gainSteps: [],
      comeback: null,
    };
  }

  const first = chain[0]!;
  // A chain starting at the default rating began from scratch; any other start
  // carries a rating earned before the records.
  let peak: { rating: number } & Provenance = {
    rating: first.oldRating,
    ...(first.oldRating === STARTING_RATING ? at(first.tournament) : LEGACY),
  };
  let bestGain: FormatStats["bestGain"] = null;
  let streak = 0;
  let bestStreak = 0;
  const streakSteps: FormatStats["streakSteps"] = [];
  const gainSteps: FormatStats["gainSteps"] = [];
  let comeback: Provenance | null = null;
  let withoutGain = 0;

  for (const row of chain) {
    const end = row.oldRating + row.variation;
    if (row.oldRating > peak.rating) peak = { rating: row.oldRating, ...UNKNOWN };
    if (end > peak.rating) peak = { rating: end, ...at(row.tournament) };
    if (row.variation > 0 && (bestGain === null || row.variation > bestGain.variation)) {
      bestGain = { variation: row.variation, ...at(row.tournament) };
    }
    streak = row.variation > 0 ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
    for (const length of POSITIVE_STREAK_STEPS) {
      if (streak === length && !streakSteps.some((step) => step.length === length)) {
        streakSteps.push({ length, ...at(row.tournament) });
      }
    }
    for (const step of GAIN_STEPS) {
      if (row.variation >= step && !gainSteps.some((gain) => gain.step === step)) {
        gainSteps.push({ step, ...at(row.tournament) });
      }
    }
    if (row.variation > 0) {
      if (withoutGain >= COMEBACK_AFTER && comeback === null) comeback = at(row.tournament);
      withoutGain = 0;
    } else {
      withoutGain++;
    }
  }
  if (current > peak.rating) peak = { rating: current, ...UNKNOWN };

  return {
    results: chain.length,
    peak,
    bestGain,
    currentStreak: streak,
    bestStreak,
    thresholds: RATING_THRESHOLDS.filter((threshold) => peak.rating >= threshold).map((threshold) => ({
      threshold,
      ...thresholdProvenance(chain, threshold),
    })),
    streakSteps,
    gainSteps,
    comeback,
  };
}

function thresholdProvenance(chain: RatingResult[], threshold: number): Provenance {
  for (const [index, row] of chain.entries()) {
    if (row.oldRating >= threshold) return index === 0 ? LEGACY : UNKNOWN;
    if (row.oldRating + row.variation >= threshold) return at(row.tournament);
  }
  return UNKNOWN;
}

function medals(podiums: { place: number | null }[]): Medals {
  const count = (place: number) => podiums.filter((podium) => podium.place === place).length;
  return { gold: count(1), silver: count(2), bronze: count(3) };
}

// Overall wins of tournaments and circuit seasons grouped by championship;
// tournaments without a championship cannot form a dynasty.
function dynasties(input: StatsInput): Dynasty[] {
  const wins = new Map<number, { name: string; wins: Dynasty["wins"] }>();
  const add = (competition: Competition, year: number | null, provenance: Provenance) => {
    if (competition.championshipId === null) return;
    const entry = wins.get(competition.championshipId) ?? { name: competition.championshipName ?? "", wins: [] };
    entry.wins.push({ year, ...provenance });
    wins.set(competition.championshipId, entry);
  };
  for (const podium of input.tournamentPodiums) {
    if (podium.place === 1 && podium.category === null) {
      add(podium.tournament, yearOf(podium.tournament.date), at(podium.tournament));
    }
  }
  for (const podium of input.circuitFinalPodiums) {
    if (podium.place === 1 && podium.category === null) {
      add(podium.circuit, podium.circuit.year, { earnedAt: podium.circuit.date, tournamentId: null, legacy: false });
    }
  }
  return [...wins]
    .map(([championshipId, entry]) => ({
      championshipId,
      championshipName: entry.name,
      wins: entry.wins.sort((a, b) => byDate(a.earnedAt, b.earnedAt)),
      longestRun: longestRun(entry.wins.map((win) => win.year)),
    }))
    .sort((a, b) => b.wins.length - a.wins.length || a.championshipId - b.championshipId);
}

function longestRun(years: (number | null)[]): Dynasty["longestRun"] {
  const sorted = [...new Set(years.filter((year): year is number => year !== null))].sort((a, b) => a - b);
  let best: Dynasty["longestRun"] = { length: sorted.length > 0 ? 1 : 0, endYear: sorted[0] ?? null };
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1]! + 1 ? run + 1 : 1;
    if (run > best.length) best = { length: run, endYear: sorted[i]! };
  }
  return best;
}

function firsts(input: StatsInput, firstPlayed: PlayerStats["played"][number] | undefined): PlayerStats["firsts"] {
  const earliest = (candidates: Provenance[]) => candidates.sort((a, b) => byDate(a.earnedAt, b.earnedAt))[0] ?? null;
  const positive = input.results
    .filter((result) => result.variation > 0)
    .sort((a, b) => byDate(a.tournament.date, b.tournament.date) || a.id - b.id)[0];
  const podiums: Provenance[] = [
    ...input.tournamentPodiums.filter((podium) => podium.place <= 3).map((podium) => at(podium.tournament)),
    ...input.circuitStageResults
      .filter((stage) => stage.place !== null && stage.place <= 3)
      .map((stage) => at({ id: stage.tournamentId, date: stage.date })),
    ...input.circuitFinalPodiums
      .filter((podium) => podium.place <= 3)
      .map((podium) => ({ earnedAt: podium.circuit.date, tournamentId: null, legacy: false })),
  ];
  return {
    tournament: firstPlayed ? at({ id: firstPlayed.tournamentId, date: firstPlayed.date }) : null,
    positiveResult: positive ? at(positive.tournament) : null,
    podium: earliest(podiums),
  };
}
