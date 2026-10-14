import { describe, expect, test } from "bun:test";

import { ogImagePath, ogVersion, playerCard } from "./og";

const player = {
  name: "Ana",
  nickname: null,
  classic: 1800,
  rapid: 1900,
  blitz: 1700,
  club: { name: "Clube" },
  playersToTitles: [{ title: { shortName: "MI" } }],
  tournamentPodiums: [
    { place: 1, category: null },
    { place: 1, category: "Sub 18" },
    { place: 3, category: null },
  ],
};

describe("playerCard", () => {
  test("counts overall medals only and lists titles", () => {
    expect(playerCard(player)).toMatchObject({ titles: ["MI"], medals: { gold: 1, silver: 0, bronze: 1 }, club: "Clube" });
  });
});

describe("ogVersion", () => {
  test("changes exactly when something the image shows changes", () => {
    const before = ogVersion(playerCard(player));
    expect(ogVersion(playerCard({ ...player }))).toBe(before);
    expect(ogVersion(playerCard({ ...player, rapid: 1910 }))).not.toBe(before);
    expect(ogVersion(playerCard({ ...player, playersToTitles: [] }))).not.toBe(before);
  });

  test("builds a versioned image path", () => {
    expect(ogImagePath("post", "meu-post", { title: "T" })).toMatch(/^\/api\/og\/post\/meu-post\.png\?v=[0-9a-z]+$/);
  });
});
