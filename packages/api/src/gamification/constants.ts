import type { CompetitionTier } from "../circuit-types";

// The rating every new player starts with (players.* defaults).
export const STARTING_RATING = 1900;

// The rating steps of the title ladder on /normas-tecnicas (MMS 2000 … GMS 2400).
export const RATING_THRESHOLDS = [2000, 2100, 2200, 2300, 2400] as const;

export const TOURNAMENTS_PLAYED_STEPS = [10, 25, 50, 100] as const;
export const POSITIVE_STREAK_STEPS = [3, 5, 10] as const;

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
