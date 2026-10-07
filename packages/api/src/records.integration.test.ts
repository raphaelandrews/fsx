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

describe("records.statistics", () => {
  test("summarizes database activity and the open/female player counts", async () => {
    const before = await caller.records.statistics();
    const locationId = idOf(await caller.locations.create({ name: "Cidade Estatísticas", type: "city" }));
    const playerId = idOf(await caller.players.create({
      name: "Jogadora Estatísticas",
      blitz: 1900,
      rapid: 2300,
      classic: 2100,
      sex: "female",
      active: true,
      locationId,
    }));
    const tournamentId = idOf(await caller.tournaments.create({
      name: "Torneio Estatísticas",
      ratingType: "rapid",
      date: "2026-10-01",
    }));
    await caller.tournaments.create({ name: "Torneio sem data", ratingType: "rapid" });
    await caller.playersTournament.linkWithRating({ playerId, tournamentId, variation: 0, ratingType: "rapid" });
    await caller.tournamentPodiums.create({ playerId, tournamentId, place: 1 });

    const statistics = await caller.records.statistics();
    expect(statistics.players).toEqual({
      total: before.players.total + 1,
      active: before.players.active + 1,
      femaleActive: before.players.femaleActive + 1,
    });
    expect(statistics.tournaments.total).toBe(before.tournaments.total + 2);
    expect(statistics.ratingResults).toBe(before.ratingResults + 1);
    expect(statistics.tournamentPodiums).toBe(before.tournamentPodiums + 1);
    expect(statistics.citiesRepresented).toBe(before.citiesRepresented + 1);
    expect(statistics.tournaments.lastDate).toBe("2026-10-01");
    expect(statistics.ratingsByThreshold).toHaveLength(5);
    expect(statistics.ratingsByThreshold.find((row) => row.threshold === 2000)?.rapid).toBe(
      (before.ratingsByThreshold.find((row) => row.threshold === 2000)?.rapid ?? 0) + 1,
    );
    expect(statistics.ratingsByThreshold.find((row) => row.threshold === 2100)?.classic).toBe(
      (before.ratingsByThreshold.find((row) => row.threshold === 2100)?.classic ?? 0) + 1,
    );
    expect(statistics.tournamentsByTier.find((row) => row.tier === "B")?.tournaments).toBe(
      (before.tournamentsByTier.find((row) => row.tier === "B")?.tournaments ?? 0) + 2,
    );
  });
});

describe("stored records", () => {
  test("are reused until an admin mutation changes the data", async () => {
    await caller.records.all();
    const [stored] = await db.select().from(computedResults).where(like(computedResults.key, "gamification:%"));
    expect(stored).toBeDefined();

    // A tampered stored value proves the next read did not recompute.
    const summary = JSON.parse(stored!.value);
    await db
      .update(computedResults)
      .set({ value: JSON.stringify({ ...summary, records: { ...summary.records, wins: [] } }) })
      .where(eq(computedResults.key, stored!.key));
    expect((await caller.records.all()).wins).toEqual([]);

    const playerId = idOf(await caller.players.create({ name: "Caio Recorde", blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Aberto C", ratingType: "rapid", date: "2026-03-01" }));
    await caller.tournamentPodiums.create({ playerId, tournamentId, place: 1 });
    expect((await caller.records.all()).wins.map((entry) => entry.player.name)).toContain("Caio Recorde");
  });

  test("are recomputed when computed before the last change or more than a day ago", async () => {
    await caller.records.all();
    const [stored] = await db.select().from(computedResults).where(like(computedResults.key, "gamification:%"));
    const summary = JSON.parse(stored!.value);
    const fake = JSON.stringify({ ...summary, records: { ...summary.records, wins: [] } });

    await db.update(computedResults).set({ value: fake, computedAt: 1 }).where(eq(computedResults.key, stored!.key));
    expect((await caller.records.all()).wins.length).toBeGreaterThan(0);

    await db.update(computedResults).set({ computedAt: 0 }).where(eq(computedResults.key, "data_changed"));
    await db.update(computedResults).set({ value: fake, computedAt: Date.now() - 25 * 60 * 60 * 1000 }).where(eq(computedResults.key, stored!.key));
    expect((await caller.records.all()).wins.length).toBeGreaterThan(0);
  });
});

describe("emblem rarity and record holders", () => {
  test("share comes from players with a tournament; first places become record holders", async () => {
    const { players, holders, recordHolders } = await caller.records.badges();
    const records = await caller.records.all();
    expect(players).toBeGreaterThan(0);
    expect(holders["first-tournament"]).toBeLessThanOrEqual(players);
    const leader = records.wins.find((entry) => entry.place === 1)!;
    expect(recordHolders[leader.player.id]).toContain("Mais títulos");
  });
});

describe("month highlight", () => {
  test("is the biggest gain in the current month and ignores other months", async () => {
    const month = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).slice(0, 7);
    const playerId = idOf(await caller.players.create({ name: "Dora Destaque", blitz: 1900, rapid: 1900, classic: 1900, sex: "female", active: true }));
    const thisMonth = idOf(await caller.tournaments.create({ name: "Aberto do Mês", ratingType: "rapid", date: `${month}-02` }));
    const longAgo = idOf(await caller.tournaments.create({ name: "Aberto Antigo", ratingType: "blitz", date: "2001-01-10" }));
    await caller.playersTournament.linkWithRating({ playerId, tournamentId: thisMonth, variation: 61, ratingType: "rapid" });
    await caller.playersTournament.linkWithRating({ playerId, tournamentId: longAgo, variation: 90, ratingType: "blitz" });

    expect(await caller.records.monthHighlight()).toMatchObject({
      variation: 61,
      month,
      player: { id: playerId },
      tournament: { id: thisMonth, name: "Aberto do Mês" },
    });
  });

  test("is null for a month without results", async () => {
    const { monthHighlight } = await import("./routers/records");
    expect(await monthHighlight(db, "1990-06-15")).toBeNull();
  });
});
