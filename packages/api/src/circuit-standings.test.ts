import { describe, expect, test } from "bun:test";

import { circuitFinalPodiums } from "./circuit-standings";

describe("circuitFinalPodiums", () => {
  test("sums stage points per player and keeps places 1–3", () => {
    const rows = [
      { playerId: 1, points: 10, category: null },
      { playerId: 2, points: 8, category: null },
      { playerId: 1, points: 5, category: null },
      { playerId: 3, points: 7, category: null },
      { playerId: 4, points: 1, category: null },
    ];
    expect(circuitFinalPodiums("default", rows)).toEqual([
      { playerId: 1, category: null, place: 1, points: 15 },
      { playerId: 2, category: null, place: 2, points: 8 },
      { playerId: 3, category: null, place: 3, points: 7 },
    ]);
  });

  test("equal totals share a place and push the next one down", () => {
    const rows = [
      { playerId: 1, points: 10, category: null },
      { playerId: 2, points: 10, category: null },
      { playerId: 3, points: 9, category: null },
      { playerId: 4, points: 8, category: null },
    ];
    expect(circuitFinalPodiums("geral", rows).map(({ playerId, place }) => [playerId, place])).toEqual([
      [1, 1],
      [2, 1],
      [3, 3],
    ]);
  });

  test("category layouts crown a champion per category", () => {
    const rows = [
      { playerId: 1, points: 10, category: "Sub 18 Masculino" as const },
      { playerId: 2, points: 6, category: "Sub 18 Masculino" as const },
      { playerId: 3, points: 4, category: "Sub 16 Feminino" as const },
    ];
    expect(circuitFinalPodiums("school", rows)).toEqual([
      { playerId: 1, category: "Sub 18 Masculino", place: 1, points: 10 },
      { playerId: 2, category: "Sub 18 Masculino", place: 2, points: 6 },
      { playerId: 3, category: "Sub 16 Feminino", place: 1, points: 4 },
    ]);
    expect(circuitFinalPodiums("default", rows).map(({ playerId, category }) => [playerId, category])).toEqual([
      [1, null],
      [2, null],
      [3, null],
    ]);
  });

  test("players without points are never placed", () => {
    expect(circuitFinalPodiums("default", [{ playerId: 1, points: 0, category: null }])).toEqual([]);
  });
});
