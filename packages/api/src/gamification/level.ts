import { XP, xpForLevel } from "./constants";
import type { PlayerStats, StatsInput } from "./stats";

export interface LevelInput extends Pick<StatsInput, "tournamentPodiums" | "circuitStageResults" | "circuitFinalPodiums"> {
  titleTiers: number[];
}

export interface PlayerLevel {
  level: number;
  xp: number;
  // Cumulative XP where the current level starts and the next one begins.
  levelXp: number;
  nextLevelXp: number;
  breakdown: {
    tournaments: number;
    tournamentPodiums: number;
    circuitPodiums: number;
    ratingThresholds: number;
    titles: number;
  };
}

const placeXp = (table: Record<1 | 2 | 3, number>, place: number | null) =>
  place === 1 || place === 2 || place === 3 ? table[place] : 0;

const categoryFactor = (category: string | null) => (category === null ? 1 : XP.categoryPodiumFactor);

// The weights live in constants.ts (XP); GAMIFICATION.md "Phase 2" explains them.
export function playerLevel(input: LevelInput, stats: PlayerStats): PlayerLevel {
  const tournamentPodiumIds = new Set(input.tournamentPodiums.map((podium) => podium.tournament.id));

  const breakdown = {
    tournaments: stats.tournamentsPlayed * XP.tournamentPlayed,
    tournamentPodiums: input.tournamentPodiums.reduce(
      (sum, podium) =>
        sum +
        placeXp(XP.tournamentPodium, podium.place) *
          XP.tierMultiplier[podium.tournament.tier] *
          categoryFactor(podium.category),
      0,
    ),
    circuitPodiums:
      input.circuitFinalPodiums.reduce(
        (sum, podium) =>
          sum +
          placeXp(XP.circuitFinalPodium, podium.place) *
            XP.tierMultiplier[podium.circuit.tier] *
            categoryFactor(podium.category),
        0,
      ) +
      input.circuitStageResults
        .filter((stage) => !tournamentPodiumIds.has(stage.tournamentId))
        .reduce((sum, stage) => sum + placeXp(XP.circuitStagePodium, stage.place), 0),
    ratingThresholds:
      Object.values(stats.formats).reduce((sum, format) => sum + (format?.thresholds.length ?? 0), 0) *
      XP.ratingThreshold,
    titles: Math.max(0, ...input.titleTiers.map((tier) => XP.titleByTier[tier as keyof typeof XP.titleByTier] ?? 0)),
  };
  const rounded = Object.fromEntries(
    Object.entries(breakdown).map(([source, xp]) => [source, Math.round(xp)]),
  ) as PlayerLevel["breakdown"];
  const xp = Object.values(rounded).reduce((sum, value) => sum + value, 0);

  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return { level, xp, levelXp: xpForLevel(level), nextLevelXp: xpForLevel(level + 1), breakdown: rounded };
}
