import { describe, expect, test } from "bun:test";

import { playerLevel } from "./level";
import { playerRecords, RECORD_SIZE, type CareerSummary } from "./records";
import { playerStats, type StatsInput } from "./stats";

let nextId = 1;
function career(name: string, overrides: Partial<StatsInput> = {}, active = true): CareerSummary {
  const input = {
    ratings: { classic: 1900, rapid: 1900, blitz: 1900 },
    results: [],
    tournamentPodiums: [],
    circuitStageResults: [],
    circuitFinalPodiums: [],
    titleTiers: [],
    ...overrides,
  };
  const stats = playerStats(input);
  return { player: { id: nextId++, name, nickname: null, active }, stats, level: playerLevel(input, stats), tournaments: {} };
}

const win = (id: number, date: string, championshipId: number | null = null) => ({
  place: 1,
  category: null,
  tournament: { id, name: `Torneio ${id}`, date, tier: "S" as const, championshipId, championshipName: championshipId ? "Sergipano Absoluto" : null },
});

describe("playerRecords", () => {
  test("an empty database has empty records", () => {
    const records = playerRecords([], 2026);
    expect(records.wins).toEqual([]);
    expect(records.peaks).toEqual({ classic: [], rapid: [], blitz: [] });
    expect(records.championships).toEqual([]);
  });

  test("equal values share a place, the next place skips, and inactive holders are kept", () => {
    const ana = career("Ana", { tournamentPodiums: [win(1, "2020-01-01"), win(2, "2021-01-01")] });
    const bia = career("Bia", { tournamentPodiums: [win(3, "2020-02-01"), win(4, "2021-02-01")] }, false);
    const caio = career("Caio", { tournamentPodiums: [win(5, "2020-03-01")] });
    const records = playerRecords([caio, bia, ana, career("Sem títulos")], 2026);
    expect(records.wins.map((entry) => [entry.player.name, entry.place, entry.value, entry.player.active])).toEqual([
      ["Ana", 1, 2, true],
      ["Bia", 1, 2, false],
      ["Caio", 3, 1, true],
    ]);
  });

  test("lists keep the top entries only", () => {
    const many = Array.from({ length: RECORD_SIZE + 5 }, (_, i) =>
      career(`Jogador ${i}`, { ratings: { classic: 2000 + i, rapid: 1900, blitz: 1900 } }),
    );
    const peaks = playerRecords(many, 2026).peaks.classic;
    expect(peaks).toHaveLength(RECORD_SIZE);
    expect(peaks[0]).toMatchObject({ place: 1, value: 2000 + RECORD_SIZE + 4, detail: "anterior" });
  });

  test("championship holders come from overall wins of championship tournaments", () => {
    const ana = career("Ana", { tournamentPodiums: [win(1, "2018-07-01", 7), win(2, "2019-07-01", 7), win(3, "2019-08-01")] });
    const [absoluto] = playerRecords([ana], 2026).championships;
    expect(absoluto).toMatchObject({ championshipId: 7, name: "Sergipano Absoluto" });
    expect(absoluto!.holders).toEqual([
      { place: 1, player: ana.player, value: 2, detail: "2018, 2019" },
    ]);
  });

  test("championship holder lists keep the top ten", () => {
    const holders = Array.from({ length: RECORD_SIZE + 5 }, (_, i) =>
      career(`Jogador ${i}`, { tournamentPodiums: [win(i + 1, `202${i % 10}-07-01`, 7)] }),
    );
    const [absoluto] = playerRecords(holders, 2026).championships;

    expect(absoluto!.holders).toHaveLength(RECORD_SIZE);
    expect(absoluto!.holders[0]!.place).toBe(1);
  });

  test("most active counts only the requested year", () => {
    const results = ["2025-03-01", "2026-03-01", "2026-04-01"].map((date, i) => ({
      id: 100 + i,
      ratingType: "rapid" as const,
      oldRating: 1900,
      variation: 0,
      tournament: { id: 100 + i, name: "T", date, tier: "B" as const, championshipId: null, championshipName: null },
    }));
    const records = playerRecords([career("Ana", { results })], 2026);
    expect(records.activeThisYear.map((entry) => entry.value)).toEqual([2]);
  });
});
