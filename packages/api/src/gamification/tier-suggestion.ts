import type { CompetitionTier } from "../circuit-types";
import type { RatingType } from "../rating-types";
import { TIER_SUGGESTION } from "./constants";

export type StrengthLines = Record<RatingType, number>;

export interface CalibrationSample {
  ratingType: RatingType;
  date: string | null;
  championship: string | null;
  ratings: number[];
}

/** Top-N average of a field, or null when empty. */
export function fieldStrength(ratings: number[]): number | null {
  const top = [...ratings].sort((a, b) => b - a).slice(0, TIER_SUGGESTION.fieldSize);
  return top.length > 0 ? Math.round(top.reduce((sum, rating) => sum + rating, 0) / top.length) : null;
}

/**
 * The Tier A line per rhythm: the `calibrationPercentile` of the field strengths of recent
 * tournaments (last `calibrationYears` years, at least `minPlayersA` players, school events and
 * restricted championships left out), rounded up to 10. Sergipanos are ordinary members of the pool.
 * A rhythm with fewer than `calibrationMinEvents` such events keeps `fallback`.
 */
export function calibrateStrengthLines(samples: CalibrationSample[], today: string, fallback: StrengthLines): StrengthLines {
  const { calibrationYears, calibrationPercentile, calibrationMinEvents, minPlayersA, restrictedChampionships } = TIER_SUGGESTION;
  const since = `${Number(today.slice(0, 4)) - calibrationYears}${today.slice(4)}`;
  const lines = { ...fallback };
  for (const ratingType of Object.keys(lines) as RatingType[]) {
    const strengths = samples
      .filter(
        (sample) =>
          sample.ratingType === ratingType &&
          sample.date !== null &&
          sample.date >= since &&
          sample.ratings.length >= minPlayersA &&
          !(sample.championship && (restrictedChampionships as readonly string[]).includes(sample.championship)),
      )
      .map((sample) => fieldStrength(sample.ratings))
      .filter((strength): strength is number => strength !== null)
      .sort((a, b) => a - b);
    if (strengths.length >= calibrationMinEvents) {
      const nearestRank = Math.ceil(calibrationPercentile * strengths.length) - 1;
      lines[ratingType] = Math.ceil(strengths[nearestRank]! / 10) * 10;
    }
  }
  return lines;
}

export interface TierSuggestion {
  // null: nothing to suggest (a Sergipano, or no results to measure yet).
  suggested: CompetitionTier | null;
  players: number;
  // Average pre-tournament rating of the strongest TIER_SUGGESTION.fieldSize players.
  strength: number | null;
  reason: string;
}

/**
 * Suggests a tier from who played, using each player's rating before the event. It is a hint for
 * the admin, never applied automatically: Tier S follows the championship, and school events are
 * decided by who organises them (they are not always large).
 */
export function suggestTier(input: { tier: CompetitionTier; ratingType: RatingType; ratings: number[]; lines?: StrengthLines }): TierSuggestion {
  const { fieldSize, minPlayersA } = TIER_SUGGESTION;
  const players = input.ratings.length;
  const strength = fieldStrength(input.ratings);

  if (input.tier === "S") {
    return { suggested: null, players, strength, reason: "Tier S is set by the Sergipano championship, not by the field." };
  }
  if (input.tier === "school") {
    return { suggested: null, players, strength, reason: "School events are set by who organises them, not by the field." };
  }
  if (strength === null) return { suggested: null, players, strength, reason: "No rating results yet to measure the field." };
  const line = (input.lines ?? TIER_SUGGESTION.minStrengthA)[input.ratingType];
  if (players >= minPlayersA && strength >= line) {
    return { suggested: "A", players, strength, reason: `${players} players and a top-${fieldSize} average of ${strength}, at or above ${line} (${input.ratingType}).` };
  }
  const why =
    players < minPlayersA
      ? `only ${players} players (Tier A needs ${minPlayersA})`
      : `top-${fieldSize} average ${strength} is below ${line} (${input.ratingType})`;
  return { suggested: "B", players, strength, reason: `Tier B: ${why}.` };
}
