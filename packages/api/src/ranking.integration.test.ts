import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";

import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let miniflare: Miniflare;
let caller: AdminCaller;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-ranking");
  miniflare = d1.miniflare;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const player = async (name: string, rapid: number, active = true, sex: "male" | "female" = "male") =>
  idOf(await caller.players.create({ name, blitz: 1900, rapid, classic: 1900, sex, active }));

describe("ranking position and movement", () => {
  test("positions are live, shared on equal ratings, and only for active players", async () => {
    const ana = await player("Ana Ranking", 2100);
    const bia = await player("Bia Ranking", 2100);
    const caio = await player("Caio Ranking", 2000);
    const inactive = await player("Davi Inativo", 2500, false);

    expect((await caller.players.ranking({ id: ana })).rapid).toEqual({ position: 1, players: 3, movement: null });
    expect((await caller.players.ranking({ id: bia })).rapid?.position).toBe(1);
    expect((await caller.players.ranking({ id: caio })).rapid?.position).toBe(3);
    expect((await caller.players.ranking({ id: caio })).classic).toEqual({ position: 1, players: 3, movement: null });
    expect(await caller.players.ranking({ id: inactive })).toEqual({ classic: null, rapid: null, blitz: null });
    await expect(caller.players.ranking({ id: 999_999 })).rejects.toMatchObject({ code: "NOT_FOUND" });

    await caller.playersTournament.snapshotRankings({ ratingTypes: ["rapid"] });
    expect((await caller.players.ranking({ id: ana })).rapid?.movement).toBeNull();

    const tournamentId = idOf(await caller.tournaments.create({ name: "Aberto Ranking", ratingType: "rapid" }));
    await caller.playersTournament.linkWithRating({ playerId: caio, tournamentId, variation: 200, ratingType: "rapid" });
    const newcomer = await player("Eva Estreante", 1950);
    await caller.playersTournament.snapshotRankings({ ratingTypes: ["rapid"] });

    expect((await caller.players.ranking({ id: caio })).rapid).toEqual({ position: 1, players: 4, movement: 2 });
    expect((await caller.players.ranking({ id: ana })).rapid?.movement).toBe(-1);
    expect((await caller.players.ranking({ id: newcomer })).rapid?.movement).toBe("new");

    const { players } = await caller.players.withFilters({ page: 1, limit: 10, sortBy: "rapid" });
    expect(players.map((p) => [p.name, p.movement])).toEqual([
      ["Caio Ranking", 2],
      ["Ana Ranking", -1],
      ["Bia Ranking", -1],
      ["Eva Estreante", "new"],
    ]);
    const blitz = await caller.players.withFilters({ page: 1, limit: 10, sortBy: "blitz" });
    expect(blitz.players.every((p) => p.movement === null)).toBe(true);
  });

  test("female profiles show both open and female-only ranking positions", async () => {
    await player("Ana Open Leader", 4000);
    const femaleLeader = await player("Bia Feminino", 3900, true, "female");
    const femaleRunnerUp = await player("Cris Feminino", 3800, true, "female");
    const inactiveFemale = await player("Dora Inativa", 4000, false, "female");

    expect((await caller.players.ranking({ id: femaleRunnerUp })).rapid).toMatchObject({
      position: 3,
      female: { position: 2, players: 2 },
    });
    expect((await caller.players.ranking({ id: femaleLeader })).rapid).toMatchObject({
      position: 2,
      female: { position: 1, players: 2 },
    });
    expect((await caller.players.ranking({ id: inactiveFemale })).rapid).toBeNull();
  });
});
