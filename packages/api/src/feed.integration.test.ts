import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";

import { feedStart, pairTitleNotices, recentFeed } from "./gamification/feed";
import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let miniflare: Miniflare;
let caller: AdminCaller;
let db: ReturnType<typeof createDb>;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-feed");
  miniflare = d1.miniflare;
  db = createDb(d1.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const today = new Date().toISOString().slice(0, 10);

describe("feedStart", () => {
  test("is off before launch, then starts at launch or 60 days ago, whichever is later", () => {
    expect(feedStart(null, "2026-10-03")).toBeNull();
    expect(feedStart("2026-09-20", "2026-10-03")).toBe("2026-09-20");
    expect(feedStart("2026-01-01", "2026-10-03")).toBe("2026-08-04");
  });
});

describe("recent feed", () => {
  test("lists recent achievements, titles, and announcements, never history recorded late", async () => {
    const ana = idOf(await caller.players.create({ name: "Ana Feed", blitz: 1900, rapid: 1990, classic: 1900, sex: "female", active: true }));
    const recent = idOf(await caller.tournaments.create({ name: "Aberto Recente", ratingType: "rapid", date: today }));
    await caller.playersTournament.linkWithRating({ playerId: ana, tournamentId: recent, variation: 15, ratingType: "rapid" });

    const veteran = idOf(await caller.players.create({ name: "Bruno Antigo", blitz: 1900, rapid: 2190, classic: 1900, sex: "male", active: true }));
    const old = idOf(await caller.tournaments.create({ name: "Sergipano 1999", ratingType: "rapid", date: "1999-05-01" }));
    await caller.playersTournament.linkWithRating({ playerId: veteran, tournamentId: old, variation: 20, ratingType: "rapid" });
    await caller.tournamentPodiums.create({ playerId: veteran, tournamentId: old, place: 1 });

    const titleId = idOf(await caller.titles.create({ name: "Mestre Sergipano", shortName: "MSE", type: "internal", tier: 3 }));
    await caller.playersToTitles.link({ playerId: ana, titleId });
    const announcementId = idOf(await caller.announcements.create({ year: 2026, number: 7, content: "Título para Ana.", playerId: ana }));

    const items = await recentFeed(db, today);
    expect(items.every((item) => item.player.id === ana)).toBe(true);
    expect(items.map((item) => [item.kind, item.label])).toEqual(
      expect.arrayContaining([
        ["achievement", "2000 no rápido"],
        ["title", "Mestre Sergipano"],
      ]),
    );
    // The announcement about the title is folded into the title item, not listed twice.
    expect(items.find((item) => item.kind === "title")?.announcementId).toBe(announcementId);
    expect(items.some((item) => item.kind === "announcement")).toBe(false);
  });

  test("keeps announcements that don't match a title as their own items", async () => {
    const carlos = idOf(await caller.players.create({ name: "Carlos Aviso", blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true }));
    const noticeId = idOf(await caller.announcements.create({ year: 2026, number: 8, content: "Aviso para Carlos.", playerId: carlos }));

    const items = await recentFeed(db, today);
    expect(items.find((item) => item.player.id === carlos)).toMatchObject({
      kind: "announcement",
      label: "Comunicado 008/2026",
      announcementId: noticeId,
    });
  });

  test("is served through the API once the launch date is set", async () => {
    const items = await caller.records.recent();
    expect(items.map((item) => [item.player.name, item.label])).toContainEqual(["Ana Feed", "2000 no rápido"]);
  });
});

describe("players.season", () => {
  test("returns a year with activity and NOT_FOUND otherwise", async () => {
    const playerId = idOf(await caller.players.create({ name: "Carla Temporada", blitz: 1900, rapid: 1900, classic: 1900, sex: "female", active: true }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Aberto 2025", ratingType: "rapid", date: "2025-06-01" }));
    await caller.playersTournament.linkWithRating({ playerId, tournamentId, variation: 12, ratingType: "rapid" });

    const season = await caller.players.season({ id: playerId, year: 2025 });
    expect(season).toMatchObject({ player: { id: playerId }, year: 2025, tournamentsPlayed: 1, ratingChange: { rapid: 12 }, xpGained: 15 });
    expect(season.tournaments[tournamentId]?.name).toBe("Aberto 2025");
    await expect(caller.players.season({ id: playerId, year: 2024 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.players.season({ id: 999_999, year: 2025 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("pairTitleNotices", () => {
  test("pairs each award with the closest unused announcement about the same player", () => {
    const awards = [
      { playerId: 1, createdAt: "2026-09-10 12:00:00" },
      { playerId: 1, createdAt: "2026-09-12 12:00:00" },
      { playerId: 2, createdAt: "2026-09-10 12:00:00" },
    ];
    const notices = [
      { id: 10, playerId: 1, createdAt: "2026-09-11 08:00:00" },
      { id: 11, playerId: 1, createdAt: "2026-09-13 08:00:00" },
      { id: 12, playerId: 2, createdAt: "2026-12-01 08:00:00" },
      { id: 13, playerId: null, createdAt: "2026-09-10 08:00:00" },
    ];
    expect(pairTitleNotices(awards, notices)).toEqual([10, 11, null]);
  });
});
