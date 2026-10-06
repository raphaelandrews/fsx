import { describe, expect, test } from "bun:test";

import type { CompetitionTier } from "../circuit-types";
import { XP, xpForLevel } from "./constants";
import { playerLevel, type LevelInput } from "./level";
import { playerStats, type Competition, type StatsInput } from "./stats";

const competition = (id: number, tier: CompetitionTier = "S"): Competition => ({
  id,
  name: `Torneio ${id}`,
  date: "2025-01-01",
  tier,
  championshipId: null,
  championshipName: null,
});

function levelOf(overrides: Partial<StatsInput & LevelInput> = {}) {
  const input: StatsInput & LevelInput = {
    ratings: { classic: 1900, rapid: 1900, blitz: 1900 },
    results: [],
    tournamentPodiums: [],
    circuitStageResults: [],
    circuitFinalPodiums: [],
    titleTiers: [],
    ...overrides,
  };
  return playerLevel(input, playerStats(input));
}

describe("playerLevel", () => {
  test("a player without history is level 1 with no XP", () => {
    expect(levelOf()).toEqual({
      level: 1,
      xp: 0,
      levelXp: 0,
      nextLevelXp: 50,
      breakdown: { tournaments: 0, tournamentPodiums: 0, circuitPodiums: 0, ratingThresholds: 0, titles: 0 },
    });
  });

  test("each tournament played is worth the same XP", () => {
    const results = [1, 2, 3].map((id) => ({
      id,
      ratingType: "rapid" as const,
      oldRating: 1900,
      variation: 0,
      tournament: competition(id, "B"),
    }));
    expect(levelOf({ results }).breakdown.tournaments).toBe(3 * XP.tournamentPlayed);
  });

  test("tournament podiums scale with the tier, and category podiums count half", () => {
    const { breakdown } = levelOf({
      tournamentPodiums: [
        { place: 1, category: null, tournament: competition(1, "S") },
        { place: 2, category: null, tournament: competition(2, "A") },
        { place: 3, category: null, tournament: competition(3, "B") },
        { place: 1, category: "Sub 18 Masculino", tournament: competition(4, "school") },
        { place: 4, category: null, tournament: competition(5, "S") },
      ],
    });
    expect(breakdown.tournamentPodiums).toBe(Math.round(60 + 40 * 0.7 + 25 * 0.5 + 60 * 0.4 * 0.5));
    expect(breakdown.tournaments).toBe(5 * XP.tournamentPlayed);
  });

  test("finished circuit podiums scale with the circuit tier; stages are flat and skip tournament podiums", () => {
    const { breakdown } = levelOf({
      tournamentPodiums: [{ place: 1, category: null, tournament: competition(7, "S") }],
      circuitFinalPodiums: [
        { place: 1, category: null, circuit: { ...competition(100, "A"), year: 2025 } },
        { place: 2, category: "Sub 16 Feminino", circuit: { ...competition(101, "school"), year: 2025 } },
      ],
      circuitStageResults: [
        { place: 1, category: null, tournamentId: 8, date: "2025-02-01", circuit: { id: 100, name: "C", stages: 4 } },
        { place: 3, category: null, tournamentId: 9, date: "2025-03-01", circuit: { id: 100, name: "C", stages: 4 } },
        { place: 1, category: null, tournamentId: 7, date: "2025-01-01", circuit: { id: 100, name: "C", stages: 4 } },
        { place: 6, category: null, tournamentId: 10, date: "2025-04-01", circuit: { id: 100, name: "C", stages: 4 } },
      ],
    });
    expect(breakdown.circuitPodiums).toBe(Math.round(40 * 0.7 + 25 * 0.4 * 0.5 + 15 + 5));
  });

  test("each rating step reached, in any format and including legacy ones, is worth 30", () => {
    const { breakdown } = levelOf({ ratings: { classic: 2150, rapid: 2010, blitz: 1900 } });
    expect(breakdown.ratingThresholds).toBe(3 * 30);
  });

  test("only the highest title counts, by its tier", () => {
    expect(levelOf({ titleTiers: [1, 2, 3, 4] }).breakdown.titles).toBe(300);
    expect(levelOf({ titleTiers: [4, 4] }).breakdown.titles).toBe(300);
    expect(levelOf({ titleTiers: [2] }).breakdown.titles).toBe(100);
  });

  test("levels follow 25 × n × (n − 1) cumulative XP", () => {
    expect([1, 2, 3, 5, 8, 10].map(xpForLevel)).toEqual([0, 50, 150, 500, 1400, 2250]);
    expect(levelOf({ titleTiers: [4] })).toMatchObject({ xp: 300, level: 4, levelXp: 300, nextLevelXp: 500 });
    expect(levelOf({ titleTiers: [1] })).toMatchObject({ xp: 50, level: 2 });
    expect(levelOf({ titleTiers: [] })).toMatchObject({ level: 1 });
  });
});
