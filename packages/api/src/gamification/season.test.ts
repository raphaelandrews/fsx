import { describe, expect, test } from "bun:test";

import type { LevelInput } from "./level";
import { XP } from "./constants";
import { careerUpTo, playerSeason } from "./season";
import type { Competition, RatingResult, StatsInput } from "./stats";

const tournament = (id: number, date: string | null): Competition => ({
  id,
  name: `Torneio ${id}`,
  date,
  tier: "S",
  championshipId: null,
  championshipName: null,
});

const result = (id: number, date: string | null, oldRating: number, variation: number): RatingResult => ({
  id,
  ratingType: "rapid",
  oldRating,
  variation,
  tournament: tournament(id, date),
});

const career = (overrides: Partial<StatsInput & LevelInput>): StatsInput & LevelInput => ({
  ratings: { classic: 1900, rapid: 1900, blitz: 1900 },
  results: [],
  tournamentPodiums: [],
  circuitStageResults: [],
  circuitFinalPodiums: [],
  titleTiers: [],
  ...overrides,
});

describe("playerSeason", () => {
  const results = [
    result(1, "2024-03-10", 1990, 20),
    result(2, "2024-08-02", 2010, -4),
    result(3, "2025-02-01", 2006, 9),
  ];
  const input = career({ results, ratings: { classic: 1900, rapid: 2015, blitz: 1900 } });

  test("keeps only that year's tournaments, days played, rating change, and best gain", () => {
    const season = playerSeason(input, 2024);
    expect(season.tournamentsPlayed).toBe(2);
    expect(season.days).toEqual(["2024-03-10", "2024-08-02"]);
    expect(season.ratingChange).toEqual({ classic: null, rapid: 16, blitz: null });
    expect(season.bestGain).toEqual({ variation: 20, tournamentId: 1, date: "2024-03-10" });
  });

  test("a rating step counts in the year it was reached, even though today's rating is still above it", () => {
    expect(playerSeason(input, 2024).xpGained).toBe(2 * XP.tournamentPlayed + 30);
    expect(playerSeason(input, 2025).xpGained).toBe(XP.tournamentPlayed);
    expect(playerSeason(input, 2024).achievements.map((a) => a.id)).toContain("rating-rapid-2000");
    expect(playerSeason(input, 2025).achievements.map((a) => a.id)).not.toContain("rating-rapid-2000");
  });

  test("ratings held before the records count before every season", () => {
    const veteran = career({ results: [result(9, "2024-05-05", 2150, -10)], ratings: { classic: 1900, rapid: 2140, blitz: 1900 } });
    expect(playerSeason(veteran, 2024).xpGained).toBe(XP.tournamentPlayed);
  });

  test("lists tournament and finished-circuit podiums of the year, oldest first", () => {
    const season = playerSeason(
      career({
        tournamentPodiums: [
          { place: 1, category: null, tournament: tournament(20, "2024-09-01") },
          { place: 2, category: null, tournament: tournament(21, "2023-09-01") },
        ],
        circuitFinalPodiums: [
          { place: 3, category: "Sub 18 Masculino", circuit: { ...tournament(30, "2024-02-01"), name: "Circuito 2023", year: 2023 } },
        ],
      }),
      2024,
    );
    expect(season.podiums.map((podium) => [podium.name, podium.place])).toEqual([
      ["Circuito 2023", 3],
      ["Torneio 20", 1],
    ]);
  });
});

describe("careerUpTo", () => {
  test("uses the chain's rating at that date, or the rating before the first result", () => {
    const input = career({
      results: [result(1, "2024-03-10", 1950, 30), result(2, "2025-01-01", 1980, 5)],
      ratings: { classic: 1900, rapid: 1985, blitz: 1900 },
    });
    expect(careerUpTo(input, "2024-12-31").ratings.rapid).toBe(1980);
    expect(careerUpTo(input, "2023-12-31").ratings.rapid).toBe(1950);
  });
});
