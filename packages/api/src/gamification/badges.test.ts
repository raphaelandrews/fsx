import { describe, expect, test } from "bun:test";

import { achievementsOf, allBadges, badgeHolders, recordHolderAchievement, upcomingOf } from "./badges";
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
    const categories = achievementsOf(playerStats(input({ tournamentPodiums: podiums, openCategories: ["Futuro", "Juvenil", "Master"] }))).filter((a) => a.family === "category");
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

describe("Sergipano and tier emblems", () => {
  const sergipano = (id: number, date: string, championshipName: string, extra: Partial<Competition> = {}) =>
    tournament(id, date, { tier: "S", championshipId: id % 10, championshipName, ...extra });
  const win = (competition: Competition, place = 1, category: string | null = null) => ({ place, category, tournament: competition });

  test("a Sergipano win earns the kind emblem; Absoluto and Feminino are told apart by name", () => {
    const podiums = [
      win(sergipano(1, "2023-06-01", "Sergipano Absoluto")),
      win(sergipano(2, "2024-06-01", "Campeonato Sergipano Feminino")),
      win(sergipano(3, "2024-07-01", "Sergipano Rápido"), 2),
    ];
    const list = ids({ tournamentPodiums: podiums });
    expect(list).toContain("sergipano-absoluto");
    expect(list).toContain("sergipano-feminino");
    expect(list).not.toContain("sergipano-rapido");
    expect(earned({ tournamentPodiums: podiums }, "sergipano-absoluto")).toMatchObject({ earnedAt: "2023-06-01", tier: "gold" });
  });

  test("only overall wins in tier S count as Sergipano titles", () => {
    expect(ids({ tournamentPodiums: [win(sergipano(1, "2023-06-01", "Sergipano Absoluto"), 1, "Sub 14 Masculino")] })).not.toContain("sergipano-absoluto");
    expect(ids({ tournamentPodiums: [win(tournament(1, "2023-06-01", { tier: "A", championshipName: "Sergipano Absoluto" }))] })).not.toContain("sergipano-absoluto");
    expect(ids({ tournamentPodiums: [win(sergipano(1, "2023-06-01", "Sub-18"))] })).not.toContain("sergipano-sub-18");
  });

  test("Tríplice Coroa needs classic, rapid, and blitz, and is dated by the last one", () => {
    const crown = [
      win(sergipano(1, "2020-06-01", "Sergipano Feminino")),
      win(sergipano(2, "2022-06-01", "Sergipano Rápido")),
      win(sergipano(3, "2021-06-01", "Sergipano Blitz")),
    ];
    expect(earned({ tournamentPodiums: crown }, "sergipano-crown-1")).toMatchObject({ earnedAt: "2022-06-01", tier: "gold" });
    expect(ids({ tournamentPodiums: crown })).not.toContain("sergipano-crown-2");
    expect(ids({ tournamentPodiums: crown.slice(0, 2) })).not.toContain("sergipano-crown-1");
  });

  test("Tríplice Coroa em dobro needs two of each, with Absoluto and Feminino both counting as classic", () => {
    const double = [
      win(sergipano(1, "2018-06-01", "Sergipano Absoluto")),
      win(sergipano(2, "2019-06-01", "Sergipano Feminino")),
      win(sergipano(3, "2018-07-01", "Sergipano Rápido")),
      win(sergipano(4, "2019-07-01", "Sergipano Rápido")),
      win(sergipano(5, "2018-08-01", "Sergipano Blitz")),
      win(sergipano(6, "2024-08-01", "Sergipano Blitz")),
    ];
    expect(earned({ tournamentPodiums: double }, "sergipano-crown-2")).toMatchObject({ earnedAt: "2024-08-01", tier: "platinum" });
    expect(ids({ tournamentPodiums: double.slice(0, 5) })).not.toContain("sergipano-crown-2");
  });

  test("Grand Slam also needs Bullet and Equipes", () => {
    const base = [
      win(sergipano(1, "2020-06-01", "Sergipano Absoluto")),
      win(sergipano(2, "2020-07-01", "Sergipano Rápido")),
      win(sergipano(3, "2020-08-01", "Sergipano Blitz")),
      win(sergipano(4, "2021-01-01", "Sergipano Bullet")),
    ];
    expect(ids({ tournamentPodiums: base })).not.toContain("sergipano-slam");
    const all = [...base, win(sergipano(5, "2022-01-01", "Sergipano de Equipes"))];
    expect(earned({ tournamentPodiums: all }, "sergipano-slam")).toMatchObject({ earnedAt: "2022-01-01", tier: "platinum" });
  });

  test("tier wins climb 1 / 3 / 5 per tier, counting category wins", () => {
    const wins = [1, 2, 3].map((n) => win(tournament(n, `2024-0${n}-01`, { tier: "A" }), 1, n === 3 ? "Sub 14 Masculino" : null));
    expect(earned({ tournamentPodiums: wins }, "tier-A-1")).toMatchObject({ earnedAt: "2024-01-01", tier: "bronze" });
    expect(earned({ tournamentPodiums: wins }, "tier-A-3")).toMatchObject({ earnedAt: "2024-03-01", tier: "silver" });
    expect(ids({ tournamentPodiums: wins })).not.toContain("tier-A-5");
    expect(ids({ tournamentPodiums: wins })).not.toContain("tier-B-1");
  });

  test("a podium in every tier earns Pódio em todos os níveis, dated by the last tier reached", () => {
    const podiums = (["S", "A", "B", "school"] as const).map((tier, index) =>
      win(tournament(index + 1, `202${index}-05-01`, { tier }), 3),
    );
    expect(earned({ tournamentPodiums: podiums }, "tier-all-podiums")).toMatchObject({ earnedAt: "2023-05-01", tier: "platinum" });
    expect(ids({ tournamentPodiums: podiums.slice(0, 3) })).not.toContain("tier-all-podiums");
  });
});

describe("categories without an emblem", () => {
  test("Futuro, Juvenil, and Master wins earn nothing and are not in the catalog", () => {
    const podiums = ["Futuro", "Juvenil", "Master", "Sub 14 Masculino"].map((category, i) => ({
      place: 1,
      category,
      tournament: tournament(900 + i, "2024-05-01"),
    }));
    const categories = achievementsOf(playerStats(input({ tournamentPodiums: podiums, openCategories: ["Futuro", "Juvenil", "Master"] }))).filter((a) => a.family === "category");
    expect(categories.map((a) => a.id)).toEqual(["category-sub-14-masculino"]);
    const catalog = allBadges(["Sub 14 Masculino"]).map((badge) => badge.id);
    for (const id of ["category-futuro", "category-juvenil", "category-master"]) expect(catalog).not.toContain(id);
    expect(catalog).toContain("category-sub-14-masculino");
  });
});

describe("Sergipano Bullet cups", () => {
  const cup = { cupId: 1, name: "Campeonato Sergipano Bullet", championshipName: null, date: "2025-03-01" };

  test("a Bullet cup title earns the Bullet emblem and counts toward the Grand Slam", () => {
    const base = [
      win2(sergipanoAt(1, "2020-06-01", "Sergipano Absoluto")),
      win2(sergipanoAt(2, "2020-07-01", "Sergipano Rápido")),
      win2(sergipanoAt(3, "2020-08-01", "Sergipano Blitz")),
      win2(sergipanoAt(4, "2021-01-01", "Sergipano de Equipes")),
    ];
    expect(ids({ tournamentPodiums: base })).not.toContain("sergipano-slam");
    expect(ids({ tournamentPodiums: base, cupTitles: [cup] })).toContain("sergipano-bullet");
    expect(earned({ tournamentPodiums: base, cupTitles: [cup] }, "sergipano-slam")).toMatchObject({ earnedAt: "2025-03-01", tier: "platinum" });
  });

  test("a cup that is not a Sergipano kind earns nothing", () => {
    expect(ids({ cupTitles: [{ ...cup, name: "Copa dos Campeões" }] })).not.toContain("sergipano-bullet");
  });
});

function sergipanoAt(id: number, date: string, championshipName: string) {
  return tournament(id, date, { tier: "S", championshipId: id, championshipName });
}
const win2 = (competition: Competition) => ({ place: 1, category: null, tournament: competition });

const AGE_CATEGORIES = [8, 10, 12, 14, 16, 18].flatMap((age) => [`Sub ${age} Masculino`, `Sub ${age} Feminino`]);

describe("allBadges catalog", () => {
  test("ids are unique and cover every emblem a career can earn, with matching labels", () => {
    const catalog = allBadges(AGE_CATEGORIES);
    expect(new Set(catalog.map((badge) => badge.id)).size).toBe(catalog.length);
    const byId = new Map(catalog.map((badge) => [badge.id, badge]));

    const rapid = results(1900, Array.from({ length: 100 }, (_, i) => ({ variation: i % 2 ? 60 : -5, date: `${2000 + (i % 25)}-0${(i % 9) + 1}-10` })));
    const careers = [
      input({ ratings: { classic: 2450, rapid: 2450, blitz: 2450 }, results: rapid }),
      input({
        tournamentPodiums: [
          ...(["S", "A", "B", "school"] as const).flatMap((tier, t) =>
            [1, 2, 3, 4, 5].map((n) => ({ place: 1, category: n === 5 ? "Sub 14 Masculino" : null, tournament: tournament(100 * t + n, `20${10 + n}-05-01`, { tier }) })),
          ),
          ...["Absoluto", "Feminino", "Rápido", "Blitz", "de Equipes"].flatMap((name, k) =>
            [1, 2].map((n) => win2(sergipanoAt(900 + k * 10 + n, `20${10 + k * 2 + n}-06-01`, `Sergipano ${name}`))),
          ),
        ],
        cupTitles: [cup0()],
        circuitStageResults: Array.from({ length: 25 }, (_, n) => ({
          place: 1, category: null, tournamentId: 5000 + n, date: `2024-01-${String((n % 28) + 1).padStart(2, "0")}`, circuit: { id: 1, name: "Circuito", stages: 25 },
        })),
      }),
    ];
    const earnedIds = new Set<string>();
    for (const career of careers) {
      for (const achievement of achievementsOf(playerStats(career))) {
        earnedIds.add(achievement.id);
        const known = byId.get(achievement.id);
        expect(known, achievement.id).toBeDefined();
        expect(known).toMatchObject({ label: achievement.label, description: achievement.description, icon: achievement.icon, tier: achievement.tier, family: achievement.family });
      }
    }
    expect(earnedIds.size).toBeGreaterThan(40);
  });
});

function cup0() {
  return { cupId: 1, name: "Campeonato Sergipano Bullet", championshipName: null, date: "2025-03-01" };
}

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
