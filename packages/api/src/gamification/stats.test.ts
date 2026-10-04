import { describe, expect, test } from "bun:test";

import { achievementsOf } from "./badges";
import { playerStats, type Competition, type RatingResult, type StatsInput } from "./stats";

const tournament = (id: number, date: string | null, extra: Partial<Competition> = {}): Competition => ({
  id,
  name: `Torneio ${id}`,
  date,
  tier: "B",
  championshipId: null,
  championshipName: null,
  ...extra,
});

let nextId = 1;
// Builds a chain the way rating imports write it: each row starts where the
// previous one ended, unless `oldRating` forces a gap.
function chain(
  start: number,
  steps: ({ variation: number; date?: string | null; oldRating?: number })[],
  ratingType: RatingResult["ratingType"] = "rapid",
): RatingResult[] {
  let rating = start;
  return steps.map((step, index) => {
    const oldRating = step.oldRating ?? rating;
    rating = oldRating + step.variation;
    const id = nextId++;
    return {
      id,
      ratingType,
      oldRating,
      variation: step.variation,
      tournament: tournament(id, step.date === undefined ? `2025-01-${String(index + 1).padStart(2, "0")}` : step.date),
    };
  });
}

const input = (overrides: Partial<StatsInput> = {}): StatsInput => ({
  ratings: { classic: 1900, rapid: 1900, blitz: 1900 },
  results: [],
  tournamentPodiums: [],
  circuitStageResults: [],
  circuitFinalPodiums: [],
  ...overrides,
});

const endOf = (rows: RatingResult[]) => rows.at(-1)!.oldRating + rows.at(-1)!.variation;

describe("playerStats", () => {
  test("a player without history has no stats and no achievements", () => {
    const stats = playerStats(input());
    expect(stats.tournamentsPlayed).toBe(0);
    expect(stats.formats).toEqual({ classic: null, rapid: null, blitz: null });
    expect(stats.firsts).toEqual({ tournament: null, positiveResult: null, podium: null });
    expect(achievementsOf(stats)).toEqual([]);
  });

  test("a single result sets the peak, best gain, and first achievements", () => {
    const results = chain(1900, [{ variation: 15, date: "2025-03-01" }]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: 1915, blitz: 1900 } }));
    const rapid = stats.formats.rapid!;
    expect(rapid.peak).toEqual({ rating: 1915, earnedAt: "2025-03-01", tournamentId: results[0]!.id, legacy: false });
    expect(rapid.bestGain?.variation).toBe(15);
    expect(rapid.thresholds).toEqual([]);
    expect(achievementsOf(stats).map((a) => a.id)).toEqual(["first-tournament", "first-positive-result"]);
  });

  test("a chain that starts at the default rating dates its starting peak at the first tournament", () => {
    const results = chain(1900, [{ variation: -10 }]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: 1890, blitz: 1900 } }));
    expect(stats.formats.rapid!.peak).toMatchObject({ rating: 1900, legacy: false, tournamentId: results[0]!.id });
  });

  test("a chain that starts above a threshold earns it as legacy", () => {
    const results = chain(2050, [{ variation: -10 }]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: 2040, blitz: 1900 } }));
    expect(stats.formats.rapid!.peak).toMatchObject({ rating: 2050, legacy: true, earnedAt: null });
    expect(stats.formats.rapid!.thresholds).toEqual([{ threshold: 2000, earnedAt: null, tournamentId: null, legacy: true }]);
  });

  test("a recorded crossing dates the threshold at its tournament", () => {
    const results = chain(1990, [{ variation: -5 }, { variation: 20, date: "2025-06-10" }]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: endOf(results), blitz: 1900 } }));
    expect(stats.formats.rapid!.thresholds).toEqual([
      { threshold: 2000, earnedAt: "2025-06-10", tournamentId: results[1]!.id, legacy: false },
    ]);
  });

  test("a gap over a threshold earns it without a date", () => {
    const results = chain(1950, [{ variation: 10 }, { oldRating: 2010, variation: -5 }]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: 2005, blitz: 1900 } }));
    expect(stats.formats.rapid!.thresholds).toEqual([{ threshold: 2000, earnedAt: null, tournamentId: null, legacy: false }]);
    expect(stats.formats.rapid!.peak).toMatchObject({ rating: 2010, earnedAt: null, legacy: false });
  });

  test("a current rating above the chain end raises the peak and its thresholds", () => {
    const results = chain(1950, [{ variation: 30 }]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: 2105, blitz: 1900 } }));
    expect(stats.formats.rapid!.peak).toEqual({ rating: 2105, earnedAt: null, tournamentId: null, legacy: false });
    expect(stats.formats.rapid!.thresholds.map((t) => [t.threshold, t.earnedAt])).toEqual([
      [2000, null],
      [2100, null],
    ]);
  });

  test("a rating above the default without history predates the records", () => {
    const stats = playerStats(input({ ratings: { classic: 2210, rapid: 1900, blitz: 1900 } }));
    expect(stats.formats.rapid).toBeNull();
    expect(stats.formats.classic!.thresholds.map((t) => [t.threshold, t.legacy])).toEqual([
      [2000, true],
      [2100, true],
      [2200, true],
    ]);
  });

  test("an undated tournament counts, without a date and outside per-year stats", () => {
    const results = chain(1995, [{ variation: 10, date: null }, { variation: 3, date: "2024-05-01" }]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: endOf(results), blitz: 1900 } }));
    expect(stats.tournamentsPlayed).toBe(2);
    expect(stats.tournamentsByYear).toEqual({ 2024: 1 });
    expect(stats.seasons).toEqual([2024]);
    expect(stats.played.map((p) => p.date)).toEqual(["2024-05-01", null]);
    expect(stats.formats.rapid!.thresholds[0]).toMatchObject({ threshold: 2000, earnedAt: null, tournamentId: results[0]!.id });
  });

  test("chains follow id order even when tournament dates are inverted", () => {
    const results = chain(1900, [
      { variation: 5, date: "2025-05-01" },
      { variation: 5, date: "2025-01-01" },
      { variation: -1, date: "2025-03-01" },
    ]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: endOf(results), blitz: 1900 } }));
    expect(stats.formats.rapid!.bestStreak).toBe(2);
    expect(stats.formats.rapid!.currentStreak).toBe(0);
  });

  test("streaks reset on a result without gain and are badged once per step", () => {
    const results = chain(1900, [
      { variation: 1 },
      { variation: 1 },
      { variation: 1 },
      { variation: 0 },
      { variation: 2 },
    ]);
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: endOf(results), blitz: 1900 } }));
    expect(stats.formats.rapid!).toMatchObject({ bestStreak: 3, currentStreak: 1 });
    const streak = achievementsOf(stats).filter((a) => a.family === "streak");
    expect(streak.map((a) => [a.id, a.tournamentId])).toEqual([["streak-3", results[2]!.id]]);
  });

  test("tournaments played merges results, podiums, and circuit stages without double counting", () => {
    const results = chain(1900, [{ variation: 5, date: "2025-01-05" }]);
    const stats = playerStats(
      input({
        results,
        tournamentPodiums: [
          { place: 1, category: null, tournament: results[0]!.tournament },
          { place: 2, category: null, tournament: tournament(900, "1998-04-01") },
        ],
        circuitStageResults: [
          { place: 5, category: "Sub 18 Masculino", tournamentId: 901, date: "2025-02-01", circuit: { id: 1, name: "Circuito" } },
          { place: 1, category: "Sub 18 Masculino", tournamentId: results[0]!.tournament.id, date: "2025-01-05", circuit: { id: 1, name: "Circuito" } },
        ],
      }),
    );
    expect(stats.tournamentsPlayed).toBe(3);
    expect(stats.played[0]).toEqual({ tournamentId: 900, date: "1998-04-01" });
    expect(stats.firsts.podium).toMatchObject({ earnedAt: "1998-04-01", tournamentId: 900 });
  });

  test("medals keep overall, category, circuit final, and stage podiums apart; shared places all count", () => {
    const team = tournament(1, "2024-08-01", { championshipId: 5, championshipName: "Sergipano de Equipes" });
    const stats = playerStats(
      input({
        tournamentPodiums: [
          { place: 1, category: null, tournament: team },
          { place: 1, category: "Sub 18 Masculino", tournament: tournament(2, "2024-09-01") },
          { place: 3, category: null, tournament: tournament(3, "2024-10-01") },
        ],
        circuitStageResults: [
          { place: 2, category: null, tournamentId: 4, date: "2024-03-01", circuit: { id: 1, name: "C" } },
          { place: 7, category: null, tournamentId: 5, date: "2024-04-01", circuit: { id: 1, name: "C" } },
        ],
        circuitFinalPodiums: [
          { place: 1, category: "Sub 16 Feminino", circuit: { ...tournament(10, "2024-11-30"), year: 2024 } },
        ],
      }),
    );
    expect(stats.medals).toEqual({
      tournament: { gold: 1, silver: 0, bronze: 1 },
      tournamentCategory: { gold: 1, silver: 0, bronze: 0 },
      circuitFinal: { gold: 1, silver: 0, bronze: 0 },
      circuitStage: { gold: 0, silver: 1, bronze: 0 },
    });
  });

  test("dynasties count overall wins per championship, with the longest run of consecutive years", () => {
    const absoluto = (id: number, year: number) =>
      tournament(id, `${year}-07-01`, { championshipId: 1, championshipName: "Sergipano Absoluto" });
    const stats = playerStats(
      input({
        tournamentPodiums: [
          { place: 1, category: null, tournament: absoluto(1, 2018) },
          { place: 1, category: null, tournament: absoluto(2, 2019) },
          { place: 1, category: null, tournament: absoluto(3, 2023) },
          { place: 1, category: "Sub 18 Masculino", tournament: absoluto(4, 2024) },
          { place: 1, category: null, tournament: tournament(5, "2024-01-01") },
        ],
      }),
    );
    expect(stats.dynasties).toHaveLength(1);
    expect(stats.dynasties[0]!.wins.map((w) => w.year)).toEqual([2018, 2019, 2023]);
    expect(stats.dynasties[0]!.longestRun).toEqual({ length: 2, endYear: 2019 });
    const dynasty = achievementsOf(stats).filter((a) => a.family === "dynasty");
    expect(dynasty.map((a) => [a.label, a.earnedAt, a.tier])).toEqual([
      ["Tricampeão(ã) · Sergipano Absoluto", "2023-07-01", "gold"],
      ["2 títulos seguidos · Sergipano Absoluto", "2019-07-01", "gold"],
    ]);
  });

  test("tournament milestones are dated at the nth tournament played", () => {
    const results = chain(
      1900,
      Array.from({ length: 10 }, (_, i) => ({ variation: -1, date: `2020-0${(i % 9) + 1}-01` })),
    );
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: endOf(results), blitz: 1900 } }));
    const milestone = achievementsOf(stats).find((a) => a.id === "tournaments-10")!;
    expect(milestone.earnedAt).toBe(stats.played[9]!.date);
    expect(milestone.tier).toBe("bronze");
  });

  test("rating badges name the format and follow the ladder tiers", () => {
    const results = chain(1990, [{ variation: 420 }], "blitz");
    const stats = playerStats(input({ results, ratings: { classic: 1900, rapid: 1900, blitz: 2410 } }));
    const rating = achievementsOf(stats).filter((a) => a.family === "rating");
    expect(rating.map((a) => [a.label, a.tier])).toEqual([
      ["2000 na blitz", "bronze"],
      ["2100 na blitz", "bronze"],
      ["2200 na blitz", "silver"],
      ["2300 na blitz", "gold"],
      ["2400 na blitz", "platinum"],
    ]);
  });
});
