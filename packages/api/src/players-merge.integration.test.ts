import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";

import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let miniflare: Awaited<ReturnType<typeof createTestD1>>["miniflare"];
let db: ReturnType<typeof createDb>;
let caller: AdminCaller;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-players-merge");
  miniflare = d1.miniflare;
  db = createDb(d1.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const player = async (name: string, extra: Record<string, unknown> = {}) =>
  idOf(await caller.players.create({ name, blitz: 1500, rapid: 1500, classic: 1500, sex: "male", ...extra }));
const tournament = async (name: string) => idOf(await caller.tournaments.create({ name, ratingType: "rapid" }));

describe("players.merge", () => {
  test("moves history, titles and missing profile data to the kept player and deletes the duplicate", async () => {
    const kept = await player("Joao Merge", { rapid: 1600, blitz: 1400 });
    const duplicate = await player("Joao Merge", { nickname: "jm", cbxId: 4321, active: true, rapid: 1550, blitz: 1700 });
    const first = await tournament("Merge Open 1");
    const second = await tournament("Merge Open 2");
    await caller.playersTournament.linkWithRating({ playerId: kept, tournamentId: first, variation: 10, ratingType: "rapid" });
    await caller.playersTournament.linkWithRating({ playerId: duplicate, tournamentId: second, variation: 5, ratingType: "rapid" });
    await caller.tournamentPodiums.create({ playerId: duplicate, tournamentId: second, place: 1 });
    const title = idOf(await caller.titles.create({ name: "Mestre Merge", shortName: "MM", type: "internal" }));
    await caller.playersToTitles.link({ playerId: kept, titleId: title });
    await caller.playersToTitles.link({ playerId: duplicate, titleId: title });

    await caller.players.merge({ sourceId: duplicate, targetId: kept });

    const history = await db.select({ tournamentId: playersToTournaments.tournamentId }).from(playersToTournaments).where(eq(playersToTournaments.playerId, kept));
    expect(history.map((row) => row.tournamentId).sort()).toEqual([first, second].sort());
    expect(await caller.tournamentPodiums.list()).toEqual(expect.arrayContaining([expect.objectContaining({ playerId: kept })]));
    expect(await caller.playersToTitles.listByPlayer({ playerId: kept })).toHaveLength(1);
    expect(await db.select().from(players).where(eq(players.id, duplicate))).toHaveLength(0);
    expect(await caller.players.forEdit({ id: kept })).toMatchObject({ nickname: "jm", cbxId: 4321, active: true, rapid: 1615, blitz: 1400, classic: 1500 });
    expect(await caller.playersTournament.listByPlayer({ playerId: kept })).toMatchObject([
      { tournament: { id: first }, oldRating: 1600, variation: 10 },
      { tournament: { id: second }, oldRating: 1610, variation: 5 },
    ]);
  });

  test("keeps the player with the lowest id whichever one is chosen", async () => {
    const older = await player("Ana Antiga");
    const newer = await player("Ana Antiga", { nickname: "ana" });

    expect(await caller.players.merge({ sourceId: older, targetId: newer })).toEqual({ id: older });
    expect(await db.select().from(players).where(eq(players.id, newer))).toHaveLength(0);
    expect(await caller.players.forEdit({ id: older })).toMatchObject({ nickname: "ana" });
  });

  test("rejects a merge when both players have a result in the same tournament, leaving both intact", async () => {
    const kept = await player("Maria Conflito");
    const duplicate = await player("Maria Conflito");
    const shared = await tournament("Conflict Open");
    await caller.playersTournament.linkWithRating({ playerId: kept, tournamentId: shared, variation: 1, ratingType: "rapid" });
    await caller.playersTournament.linkWithRating({ playerId: duplicate, tournamentId: shared, variation: 2, ratingType: "rapid" });

    await expect(caller.players.merge({ sourceId: duplicate, targetId: kept })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await db.select().from(players).where(eq(players.id, duplicate))).toHaveLength(1);
  });

  test("rebuilds a player's rating chain from their results and rejects unknown players", async () => {
    const id = await player("Chain Player", { rapid: 1900 });
    const first = await tournament("Chain Open 1");
    const second = await tournament("Chain Open 2");
    const [one] = await db.insert(playersToTournaments).values({ playerId: id, tournamentId: first, oldRating: 1891, variation: -9, ratingType: "rapid" }).returning();
    await db.insert(playersToTournaments).values({ playerId: id, tournamentId: second, oldRating: 1900, variation: 2, ratingType: "rapid" });

    expect(await caller.players.rebuildRatings({ id })).toMatchObject({ rapid: 1884, classic: 1500 });
    expect(await caller.playersTournament.listByPlayer({ playerId: id })).toMatchObject([
      { id: one!.id, oldRating: 1891, variation: -9 },
      { tournament: { id: second }, oldRating: 1882, variation: 2 },
    ]);
    expect(await caller.players.forEdit({ id })).toMatchObject({ rapid: 1884 });
    await expect(caller.players.rebuildRatings({ id: 999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("rejects merging a player into itself and unknown players", async () => {
    const id = await player("Solo Player");
    await expect(caller.players.merge({ sourceId: id, targetId: id })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.players.merge({ sourceId: 999999, targetId: id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.players.merge({ sourceId: id, targetId: 999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
