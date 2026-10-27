import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";
import { clubs } from "@fsx/db/schema/clubs";
import { players } from "@fsx/db/schema/players";
import { rankingSnapshots } from "@fsx/db/schema/ranking-snapshots";

import { ownerCaller, type AdminCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let caller: AdminCaller;
let dispose: () => Promise<void>;
let ana: number;
let bruno: number;

beforeAll(async () => {
  const test = await createTestD1("fsx-ratings-archive");
  const db = createDb(test.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
  dispose = () => test.miniflare.dispose();

  const [club] = await db.insert(clubs).values({ name: "Clube Arquivo" }).returning();
  const [a, b] = await db
    .insert(players)
    .values([
      { name: "Ana Arquivo", rapid: 1900, clubId: club!.id },
      { name: "Bruno Arquivo", rapid: 1800 },
    ])
    .returning();
  ana = a!.id;
  bruno = b!.id;
  await db.insert(rankingSnapshots).values([
    { playerId: ana, ratingType: "rapid", position: 2, rating: 1850, snapshotAt: "2030-01-10 10:00:00.000" },
    { playerId: bruno, ratingType: "rapid", position: 1, rating: 1900, snapshotAt: "2030-01-10 10:00:00.000" },
    { playerId: ana, ratingType: "rapid", position: 1, rating: 1880, snapshotAt: "2030-01-20 09:00:00.000" },
    { playerId: bruno, ratingType: "rapid", position: 2, rating: 1870, snapshotAt: "2030-01-20 09:00:00.000" },
    { playerId: ana, ratingType: "rapid", position: 1, rating: 1900, snapshotAt: "2030-01-20 18:00:00.000" },
    { playerId: bruno, ratingType: "rapid", position: 2, rating: 1800, snapshotAt: "2030-01-20 18:00:00.000" },
    { playerId: ana, ratingType: "blitz", position: 1, rating: 1700, snapshotAt: "2030-02-01 08:00:00.000" },
  ]);
});

afterAll(async () => {
  await dispose();
});

describe("the rating list archive", () => {
  test("lists each day with a recorded list once, newest first, per format", async () => {
    expect((await caller.ratings.lists({ ratingType: "rapid" })).dates).toEqual(["2030-01-20", "2030-01-10"]);
    expect((await caller.ratings.lists({ ratingType: "blitz" })).dates).toEqual(["2030-02-01"]);
    expect((await caller.ratings.lists({ ratingType: "classic" })).dates).toEqual([]);
  });

  test("a day shows its last list, ordered by position, with the club", async () => {
    const list = await caller.ratings.snapshot({ date: "2030-01-20", ratingType: "rapid", page: 1 });
    expect(list.players.map((p) => [p.name, p.position, p.rating, p.club])).toEqual([
      ["Ana Arquivo", 1, 1900, "Clube Arquivo"],
      ["Bruno Arquivo", 2, 1800, null],
    ]);
    expect(list.pagination.totalItems).toBe(2);
    const earlier = await caller.ratings.snapshot({ date: "2030-01-10", ratingType: "rapid", page: 1 });
    expect(earlier.players[0]).toMatchObject({ name: "Bruno Arquivo", position: 1 });
  });

  test("rejects a day without a list and a malformed date", async () => {
    await expect(caller.ratings.snapshot({ date: "2030-01-15", ratingType: "rapid", page: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.ratings.snapshot({ date: "2030-1-5", ratingType: "rapid", page: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("a player's ranking history", () => {
  test("returns points oldest first per format", async () => {
    const history = await caller.players.rankingHistory({ id: ana });
    expect(history.rapid.map((p) => [p.at, p.position, p.rating])).toEqual([
      ["2030-01-10", 2, 1850],
      ["2030-01-20", 1, 1880],
      ["2030-01-20", 1, 1900],
    ]);
    expect(history.blitz).toHaveLength(1);
    expect(history.classic).toEqual([]);
  });

  test("an unknown player is NOT_FOUND", async () => {
    await expect(caller.players.rankingHistory({ id: 999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("archive days follow the federation calendar", () => {
  test("an evening import belongs to its local day, not the next UTC day", async () => {
    const test = await createTestD1("fsx-ratings-archive-tz");
    const db = createDb(test.binding);
    const admin = await ownerCaller(appRouter.createCaller, db);
    const [p] = await db.insert(players).values({ name: "Noite Local", rapid: 1900 }).returning();
    // 22:30 in Sao Paulo (UTC-3) is 01:30 UTC of the next day.
    await db.insert(rankingSnapshots).values({ playerId: p!.id, ratingType: "rapid", position: 1, rating: 1900, snapshotAt: "2030-03-11 01:30:00.000" });
    expect((await admin.ratings.lists({ ratingType: "rapid" })).dates).toEqual(["2030-03-10"]);
    expect((await admin.ratings.snapshot({ date: "2030-03-10", ratingType: "rapid", page: 1 })).players).toHaveLength(1);
    await expect(admin.ratings.snapshot({ date: "2030-03-11", ratingType: "rapid", page: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await test.miniflare.dispose();
  });
});
