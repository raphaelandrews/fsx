import { describe, expect, test } from "bun:test";

import { achievementsOf, badgeHolders, recordHolderAchievement, upcomingOf } from "./badges";
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
function results(start: number, steps: { variation: number; date: string }[], ratingType: RatingResult["ratingType"] = "rapid") {
  let rating = start;
  return steps.map((step) => {
    const oldRating = rating;
    rating += step.variation;
    const id = nextId++;
    return { id, ratingType, oldRating, variation: step.variation, tournament: tournament(id, step.date) };
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

const ids = (overrides: Partial<StatsInput>) => achievementsOf(playerStats(input(overrides))).map((a) => a.id);
const earned = (overrides: Partial<StatsInput>, id: string) =>
  achievementsOf(playerStats(input(overrides))).find((a) => a.id === id);

describe("phase 8 emblems", () => {
  test("Veterano counts distinct seasons and is dated by the start of the Nth one", () => {
    const rows = results(1900, [2010, 2011, 2012, 2013, 2014].map((year) => ({ variation: 1, date: `${year}-05-01` })));
    expect(earned({ results: rows }, "veteran-5")).toMatchObject({ earnedAt: "2014-05-01", tier: "bronze" });
    expect(ids({ results: rows.slice(0, 4) })).not.toContain("veteran-5");
  });

  test("Maratonista needs the tournaments in one year and is dated by the Nth", () => {
    const rows = results(1900, Array.from({ length: 6 }, (_, i) => ({ variation: 1, date: `2024-0${i + 1}-10` })));
    expect(earned({ results: rows }, "marathon-6")).toMatchObject({ earnedAt: "2024-06-10" });
    const split = results(1900, [
      ...Array.from({ length: 3 }, (_, i) => ({ variation: 1, date: `2023-0${i + 1}-10` })),
      ...Array.from({ length: 3 }, (_, i) => ({ variation: 1, date: `2024-0${i + 1}-10` })),
    ]);
    expect(ids({ results: split })).not.toContain("marathon-6");
  });

  test("Tríplice needs all three formats in the same year", () => {
    const year = [
      ...results(1900, [{ variation: 1, date: "2024-02-01" }], "classic"),
      ...results(1900, [{ variation: 1, date: "2024-03-01" }], "rapid"),
      ...results(1900, [{ variation: 1, date: "2024-04-01" }], "blitz"),
    ];
    expect(earned({ results: year }, "formats-year")).toMatchObject({ earnedAt: "2024-04-01" });
    const spread = [
      ...results(1900, [{ variation: 1, date: "2023-02-01" }], "classic"),
      ...results(1900, [{ variation: 1, date: "2024-03-01" }], "rapid"),
      ...results(1900, [{ variation: 1, date: "2024-04-01" }], "blitz"),
    ];
    expect(ids({ results: spread })).not.toContain("formats-year");
  });

  test("Tríplice 2000 is dated by the last format to reach 2000, and legacy only if all three are", () => {
    const rows = [
      ...results(1990, [{ variation: 20, date: "2020-01-01" }], "classic"),
      ...results(1990, [{ variation: 20, date: "2022-01-01" }], "rapid"),
      ...results(1990, [{ variation: 20, date: "2021-01-01" }], "blitz"),
    ];
    expect(earned({ results: rows }, "formats-2000")).toMatchObject({ earnedAt: "2022-01-01", tier: "platinum" });
    const legacy = earned({ ratings: { classic: 2050, rapid: 2050, blitz: 2050 } }, "formats-2000");
    expect(legacy).toMatchObject({ legacy: true, earnedAt: null });
  });

  test("Volta por cima needs a gain after three results without one", () => {
    const rows = results(1950, [
      { variation: -5, date: "2024-01-01" },
      { variation: 0, date: "2024-02-01" },
      { variation: -3, date: "2024-03-01" },
      { variation: 8, date: "2024-04-01" },
    ]);
    expect(earned({ results: rows }, "comeback")).toMatchObject({ earnedAt: "2024-04-01" });
    expect(ids({ results: rows.slice(1) })).not.toContain("comeback");
  });

  test("Grande salto unlocks each gain step once, at the first result reaching it", () => {
    const rows = results(1900, [
      { variation: 35, date: "2024-01-01" },
      { variation: 55, date: "2024-02-01" },
    ]);
    expect(earned({ results: rows }, "leap-30")).toMatchObject({ earnedAt: "2024-01-01" });
    expect(earned({ results: rows }, "leap-50")).toMatchObject({ earnedAt: "2024-02-01" });
    expect(ids({ results: rows })).not.toContain("leap-80");
  });

  test("Circuito completo needs every stage of a season; stage podiums count places 1–3", () => {
    const circuit = { id: 7, name: "Circuito 2024", stages: 3 };
    const stages = [1, 2, 3].map((n) => ({ place: n, category: null, tournamentId: 700 + n, date: `2024-0${n}-01`, circuit }));
    expect(earned({ circuitStageResults: stages }, "circuit-complete")).toMatchObject({ earnedAt: "2024-03-01" });
    expect(earned({ circuitStageResults: stages }, "stage-podiums-3")).toMatchObject({ earnedAt: "2024-03-01" });
    expect(ids({ circuitStageResults: stages.slice(0, 2) })).not.toContain("circuit-complete");
  });

  test("Campeão de categoria: one emblem per category, from the first win", () => {
    const podiums = [
      { place: 1, category: "Sub 14", tournament: tournament(800, "2022-05-01") },
      { place: 1, category: "Sub 14", tournament: tournament(801, "2023-05-01") },
      { place: 2, category: "Sub 16", tournament: tournament(802, "2023-06-01") },
    ];
    const categories = achievementsOf(playerStats(input({ tournamentPodiums: podiums }))).filter((a) => a.family === "category");
    expect(categories).toHaveLength(1);
    expect(categories[0]).toMatchObject({ id: "category-sub-14", earnedAt: "2022-05-01" });
  });

  test("Década needs a result ten years after the first one", () => {
    const rows = results(1900, [
      { variation: 1, date: "2012-03-10" },
      { variation: 1, date: "2022-03-09" },
      { variation: 1, date: "2022-03-10" },
    ]);
    expect(earned({ results: rows }, "decade")).toMatchObject({ earnedAt: "2022-03-10" });
    expect(ids({ results: rows.slice(0, 2) })).not.toContain("decade");
  });

  test("Recordista lists the records held", () => {
    expect(recordHolderAchievement(["Mais títulos"])).toMatchObject({ id: "record-holder", tier: "platinum" });
    expect(recordHolderAchievement(["A", "B"]).description).toContain("2 recordes");
  });
});

describe("progress", () => {
  test("locked emblems carry progress toward their target", () => {
    const rows = results(1900, Array.from({ length: 7 }, (_, i) => ({ variation: 8, date: `2024-0${i + 1}-01` })));
    const upcoming = upcomingOf(playerStats(input({ results: rows })));
    expect(upcoming.find((a) => a.id === "tournaments-10")?.progress).toEqual({ current: 7, target: 10 });
    expect(upcoming.find((a) => a.id === "rating-rapid-2000")?.progress).toEqual({ current: 1956, target: 2000 });
    expect(upcoming.find((a) => a.id === "marathon-10")?.progress).toEqual({ current: 7, target: 10 });
  });

});

describe("badgeHolders", () => {
  test("counts players with at least one tournament and each emblem they hold", () => {
    const one = playerStats(input({ results: results(1900, [{ variation: 5, date: "2024-01-01" }]) }));
    const none = playerStats(input());
    const { players, holders } = badgeHolders([one, none]);
    expect(players).toBe(1);
    expect(holders["first-tournament"]).toBe(1);
    expect(holders["decade"]).toBeUndefined();
  });
});
