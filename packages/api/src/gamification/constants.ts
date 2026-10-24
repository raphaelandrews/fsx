import type { CompetitionTier } from "../circuit-types";
import type { RatingType } from "../rating-types";

// The rating every new player starts with (players.* defaults).
export const STARTING_RATING = 1900;

// A club is ranked by the average of its CLUB_STRENGTH_SIZE best active players. Empty slots
// count as a newcomer (STARTING_RATING, or the club's weakest counted player if lower), so a club
// needs depth to compete; with fewer than CLUB_MIN_ACTIVE active players it is left unranked.
export const CLUB_STRENGTH_SIZE = 10;
export const CLUB_MIN_ACTIVE = 3;

// Suggested tournament tier, from the field (see tier-suggestion.ts and guide/tournaments). The
// strength lines below are the starting values (measured on 2023-2026); an admin recalibrates them
// from the recent results of every non-school tournament (`calibrateStrengthLines`). School events
// are not detected: not all of them are large.
export const TIER_SUGGESTION = {
  fieldSize: 10,
  minPlayersA: 20,
  // Left out of the calibration pool: a restricted field is weaker by design.
  restrictedChampionships: ["Feminino"],
  calibrationYears: 3,
  // Tier A is the strongest quarter of recent fields; with fewer events than this per rhythm a
  // percentile means nothing, so the previous line stays.
  calibrationPercentile: 0.75,
  calibrationMinEvents: 8,
  minStrengthA: { rapid: 2250, blitz: 2040, classic: 2010 } satisfies Record<RatingType, number>,
} as const;

// The rating steps of the title ladder on /normas-tecnicas (MMS 2000 … GMS 2400).
export const RATING_THRESHOLDS = [2000, 2100, 2200, 2300, 2400] as const;

export const TOURNAMENTS_PLAYED_STEPS = [10, 25, 50, 100] as const;
export const POSITIVE_STREAK_STEPS = [3, 5, 10] as const;
// Phase 8 emblems.
export const VETERAN_SEASON_STEPS = [5, 10, 20] as const;
export const MARATHON_STEPS = [6, 10, 15] as const;
export const GAIN_STEPS = [30, 50, 80] as const;
export const STAGE_PODIUM_STEPS = [3, 10, 25] as const;
// "Volta por cima": a gain right after this many results without one, same format.
export const COMEBACK_AFTER = 3;
export const DECADE_YEARS = 10;

// The "Novidades" feed shows only items dated on or after this day (and within
// the last 60 days), so launch does not publish decades of history as news.
// Achievements are dated by their tournament; null turns the feed off.
export const GAMIFICATION_LAUNCH_DATE: string | null = "2026-09-01";

// Stats load a player's whole career in one query; the largest today is 78
// results (gamification-readiness.sql: max_results_per_player).
export const PLAYER_RESULTS_LIMIT = 500;

// Phase 2 (player level). Kept here so every weight lives in one table.
export const XP = {
  tournamentPlayed: 15,
  tournamentPodium: { 1: 60, 2: 40, 3: 25 },
  circuitFinalPodium: { 1: 40, 2: 25, 3: 15 },
  circuitStagePodium: { 1: 15, 2: 10, 3: 5 },
  ratingThreshold: 30,
  // Only the player's highest title counts: two top titles (e.g. GMS and MN)
  // otherwise outweighed decades of tournaments (production run, 2026-10-04).
  titleByTier: { 1: 50, 2: 100, 3: 200, 4: 300 },
  categoryPodiumFactor: 0.5,
  tierMultiplier: { S: 1, A: 0.7, B: 0.5, school: 0.4 } satisfies Record<CompetitionTier, number>,
} as const;

// Cumulative XP needed to reach `level`: 25 × n × (n − 1).
export const xpForLevel = (level: number) => 25 * level * (level - 1);
