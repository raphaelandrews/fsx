import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, like } from "drizzle-orm";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";
import { computedResults } from "@fsx/db/schema/computedResults";

import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let miniflare: Miniflare;
let caller: AdminCaller;
let db: ReturnType<typeof createDb>;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-records");
  miniflare = d1.miniflare;
  db = createDb(d1.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;

describe("records.all", () => {
  test("is empty without players", async () => {
    const records = await caller.records.all();
    expect(records.wins).toEqual([]);
    expect(records.levels).toEqual([]);
  });

  test("each record matches its holder's profile stats", async () => {
    const ana = idOf(await caller.players.create({ name: "Ana Recorde", blitz: 1900, rapid: 1900, classic: 1900, sex: "female", active: true }));
    const bia = idOf(await caller.players.create({ name: "Bia Recorde", blitz: 1900, rapid: 1900, classic: 1900, sex: "female", active: false }));
    for (const [playerId, variation, name] of [[ana, 140, "Aberto A"], [bia, 60, "Aberto B"]] as const) {
      const tournamentId = idOf(await caller.tournaments.create({ name, ratingType: "rapid", date: "2026-02-01" }));
      await caller.playersTournament.linkWithRating({ playerId, tournamentId, variation, ratingType: "rapid" });
      await caller.tournamentPodiums.create({ playerId, tournamentId, place: 1 });
    }
    // Playing reactivates a player; Bia retired after her last result.
    await caller.players.update({ id: bia, active: false });

    const records = await caller.records.all();
    const profile = (await caller.players.stats({ id: ana })).stats;
    expect(records.peaks.rapid[0]).toMatchObject({ place: 1, value: profile.formats.rapid!.peak.rating, detail: "Aberto A" });
    expect(records.gains.map((entry) => [entry.player.name, entry.value])).toEqual([
      ["Ana Recorde", 140],
      ["Bia Recorde", 60],
    ]);
    expect(records.wins.map((entry) => [entry.player.name, entry.place, entry.player.active])).toEqual([
      ["Ana Recorde", 1, true],
      ["Bia Recorde", 1, false],
    ]);
    expect(records.levels[0]).toMatchObject({ player: { id: ana }, value: (await caller.players.stats({ id: ana })).level.level });
  });
});

describe("stored records", () => {
  test("are reused until an admin mutation changes the data", async () => {
    const before = await caller.records.all();
    const [stored] = await db.select().from(computedResults).where(like(computedResults.key, "records:%"));
    expect(stored).toBeDefined();

    // A tampered stored value proves the next read did not recompute.
    await db.update(computedResults).set({ value: JSON.stringify({ ...before, wins: [] }) }).where(eq(computedResults.key, stored!.key));
    expect((await caller.records.all()).wins).toEqual([]);

    const playerId = idOf(await caller.players.create({ name: "Caio Recorde", blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Aberto C", ratingType: "rapid", date: "2026-03-01" }));
    await caller.tournamentPodiums.create({ playerId, tournamentId, place: 1 });
    expect((await caller.records.all()).wins.map((entry) => entry.player.name)).toContain("Caio Recorde");
  });

  test("are recomputed when computed before the last change or more than a day ago", async () => {
    const [stored] = await db.select().from(computedResults).where(like(computedResults.key, "records:%"));
    const fake = JSON.stringify({ ...(await caller.records.all()), wins: [] });

    await db.update(computedResults).set({ value: fake, computedAt: 1 }).where(eq(computedResults.key, stored!.key));
    expect((await caller.records.all()).wins.length).toBeGreaterThan(0);

    await db.update(computedResults).set({ computedAt: 0 }).where(eq(computedResults.key, "data_changed"));
    await db.update(computedResults).set({ value: fake, computedAt: Date.now() - 25 * 60 * 60 * 1000 }).where(eq(computedResults.key, stored!.key));
    expect((await caller.records.all()).wins.length).toBeGreaterThan(0);
  });
});
