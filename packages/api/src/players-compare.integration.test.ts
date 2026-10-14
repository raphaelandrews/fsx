import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller, type AdminCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let caller: AdminCaller;
let dispose: () => Promise<void>;
let ana: number;
let bruno: number;
let carla: number;
let shared: number;

const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;

beforeAll(async () => {
  const test = await createTestD1("fsx-players-compare");
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();

  const player = async (name: string) =>
    idOf(await caller.players.create({ name, sex: "male", blitz: 1900, rapid: 1900, classic: 1900, active: true, verified: false }));
  [ana, bruno, carla] = [await player("Ana Comparada"), await player("Bruno Comparado"), await player("Carla Comparada")];
  shared = idOf(await caller.tournaments.create({ name: "Aberto em Comum", ratingType: "rapid", date: "2030-05-01" }));
  const solo = idOf(await caller.tournaments.create({ name: "Só da Ana", ratingType: "rapid", date: "2030-06-01" }));
  await caller.playersTournament.linkWithRating({ playerId: ana, tournamentId: shared, variation: 12, ratingType: "rapid" });
  await caller.playersTournament.linkWithRating({ playerId: bruno, tournamentId: shared, variation: -8, ratingType: "rapid" });
  await caller.playersTournament.linkWithRating({ playerId: ana, tournamentId: solo, variation: 5, ratingType: "rapid" });
});

afterAll(async () => {
  await dispose();
});

describe("players.compare", () => {
  test("shows both players and only the tournaments they played together", async () => {
    const result = await caller.players.compare({ a: ana, b: bruno });
    expect(result.players.map((p) => p.name)).toEqual(["Ana Comparada", "Bruno Comparado"]);
    expect(result.players[0].tournamentsPlayed).toBe(2);
    expect(result.players[1].tournamentsPlayed).toBe(1);
    expect(result.common).toHaveLength(1);
    expect(result.common[0]).toMatchObject({
      tournamentId: shared,
      name: "Aberto em Comum",
      a: { variation: 12 },
      b: { variation: -8 },
    });
  });

  test("order decides the sides, and players with nothing in common get an empty list", async () => {
    const swapped = await caller.players.compare({ a: bruno, b: ana });
    expect(swapped.players[0].id).toBe(bruno);
    expect(swapped.common[0]).toMatchObject({ a: { variation: -8 }, b: { variation: 12 } });
    expect((await caller.players.compare({ a: ana, b: carla })).common).toEqual([]);
  });

  test("rejects the same player twice and unknown players", async () => {
    await expect(caller.players.compare({ a: ana, b: ana })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.players.compare({ a: ana, b: 999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.players.compare({ a: 999999, b: ana })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
