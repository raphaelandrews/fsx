import { describe, expect, test } from "bun:test";

import { playerStats, type Competition, type StatsInput } from "./stats";
import { titlePath, type TitlePathInput } from "./title-path";

const event = (id: number, championshipId: number | null, date = "2024-05-01"): Competition => ({
  id,
  name: `Sergipano ${id}`,
  date,
  tier: "S",
  championshipId,
  championshipName: null,
});

function path(overrides: Partial<StatsInput> & Partial<Omit<TitlePathInput, "stats" | "podiums">> = {}) {
  const input: StatsInput = {
    ratings: overrides.ratings ?? { classic: 1900, rapid: 1900, blitz: 1900 },
    results: [],
    tournamentPodiums: overrides.tournamentPodiums ?? [],
    circuitStageResults: [],
    circuitFinalPodiums: [],
  };
  return titlePath({
    stats: playerStats(input),
    podiums: input.tournamentPodiums,
    sex: overrides.sex ?? "male",
    birthDate: overrides.birthDate ?? null,
    heldShortNames: overrides.heldShortNames ?? [],
    year: overrides.year ?? 2026,
  });
}

describe("titlePath", () => {
  test("MSE is complete with 2300 and an Absoluto title", () => {
    const goals = path({
      ratings: { classic: 1900, rapid: 2310, blitz: 1900 },
      tournamentPodiums: [{ place: 1, category: null, tournament: event(10, 1) }],
      heldShortNames: ["CMS"],
    });
    expect(goals.find((goal) => goal.shortName === "MSE")?.complete).toBe(true);
    expect(goals.some((goal) => goal.shortName === "GMS")).toBe(false);
  });

  test("only podiums in the listed championships count, overall category only", () => {
    const goals = path({
      ratings: { classic: 1900, rapid: 2400, blitz: 1900 },
      heldShortNames: ["MSE"],
      tournamentPodiums: [
        { place: 2, category: null, tournament: event(11, 2) },
        { place: 2, category: "Sub 18", tournament: event(12, 3) },
        { place: 1, category: null, tournament: event(13, null) },
        { place: 3, category: null, tournament: event(14, 6) },
      ],
    });
    const gms = goals.find((goal) => goal.shortName === "GMS")!;
    expect(gms.anyOf[0]).toMatchObject({ current: 1, target: 4, met: false });
  });

  test("shows only the next major-title goal", () => {
    const majorGoals = (heldShortNames: string[] = []) =>
      path({ heldShortNames })
        .filter((goal) => goal.shortName === "CMS" || goal.shortName === "MSE" || goal.shortName === "GMS")
        .map((goal) => goal.shortName);

    expect(majorGoals()).toEqual(["CMS"]);
    expect(majorGoals(["CMS"])).toEqual(["MSE"]);
    expect(majorGoals(["MSE"])).toEqual(["GMS"]);
    expect(majorGoals(["GMS"])).toEqual([]);
  });

  test("youth titles: hidden past the age limit, unknown without a birth date", () => {
    expect(path({ birthDate: "2000-01-01" }).map((goal) => goal.shortName)).not.toContain("MMS");
    const mms = path({ birthDate: "2014-03-01" }).find((goal) => goal.shortName === "MMS")!;
    expect(mms.all[1]).toMatchObject({ current: 12, met: true });
    const unknown = path().find((goal) => goal.shortName === "MJS")!;
    expect(unknown.all[1]!.met).toBeNull();
    expect(unknown.complete).toBe(false);
  });

  test("MFS appears only for female players", () => {
    expect(path({ sex: "male" }).map((goal) => goal.shortName)).not.toContain("MFS");
    expect(path({ sex: "female" }).map((goal) => goal.shortName)).toContain("MFS");
  });
});
