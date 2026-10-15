import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";

import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

type RatingType = "blitz" | "rapid" | "classic";

let miniflare: Miniflare;
let caller: AdminCaller;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-rating-history");
  miniflare = d1.miniflare;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;

async function createPlayer(name: string) {
  return idOf(await caller.players.create({ name, blitz: 1500, rapid: 1500, classic: 1500, sex: "male" }));
}

async function createTournament(name: string, ratingType: RatingType = "rapid") {
  return idOf(await caller.tournaments.create({ name, ratingType }));
}

async function apply(playerId: number, tournamentId: number, variation: number, ratingType: RatingType = "rapid") {
  return idOf(await caller.playersTournament.linkWithRating({ playerId, tournamentId, variation, ratingType }));
}

// Each row's old_rating must equal the previous row's result, and the last
// result must equal the player's current rating.
async function expectChainInSync(playerId: number) {
  const history = await caller.playersTournament.listByPlayer({ playerId });
  const player = await caller.players.forEdit({ id: playerId });
  for (const ratingType of ["blitz", "rapid", "classic"] as const) {
    let rating = 1500;
    for (const row of history.filter((entry) => entry.ratingType === ratingType)) {
      expect(row.oldRating).toBe(rating);
      rating = row.oldRating + row.variation;
    }
    expect(player[ratingType]).toBe(rating);
  }
}

describe("rating history corrections", () => {
  test("correcting a variation shifts the rating and every later result of that rating type", async () => {
    const playerId = await createPlayer("Correção Um");
    const first = await createTournament("Correção Rápido 1");
    const second = await createTournament("Correção Rápido 2");
    const blitz = await createTournament("Correção Blitz", "blitz");
    const third = await createTournament("Correção Rápido 3");

    const firstResult = await apply(playerId, first, 10);
    await apply(playerId, second, 5);
    await apply(playerId, blitz, 7, "blitz");
    await apply(playerId, third, -3);

    await caller.playersTournament.correctVariation({ id: firstResult, variation: 20 });

    const player = await caller.players.forEdit({ id: playerId });
    expect(player.rapid).toBe(1522);
    expect(player.blitz).toBe(1507);
    await expectChainInSync(playerId);
  });

  test("removing a result reverts it and rebases later results", async () => {
    const playerId = await createPlayer("Remoção Um");
    const first = await createTournament("Remoção 1");
    const second = await createTournament("Remoção 2");
    await apply(playerId, first, 12);
    const secondResult = await apply(playerId, second, -4);
    const third = await createTournament("Remoção 3");
    await apply(playerId, third, 6);

    await caller.playersTournament.remove({ id: secondResult });

    expect((await caller.players.forEdit({ id: playerId })).rapid).toBe(1518);
    expect(await caller.playersTournament.listByPlayer({ playerId })).toHaveLength(2);
    await expectChainInSync(playerId);
    await expect(caller.playersTournament.remove({ id: secondResult })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("reverting a tournament restores every participant and rebases their later results", async () => {
    const alice = await createPlayer("Reversão Alice");
    const bruno = await createPlayer("Reversão Bruno");
    const earlier = await createTournament("Reversão Anterior");
    const wrong = await createTournament("Reversão Errado");
    const later = await createTournament("Reversão Posterior");

    await apply(alice, earlier, 8);
    await apply(alice, wrong, 15);
    await apply(bruno, wrong, -9);
    await apply(alice, later, 2);
    await apply(bruno, later, 4);

    expect(await caller.playersTournament.revertTournament({ tournamentId: wrong })).toEqual({ reverted: 2 });

    expect((await caller.players.forEdit({ id: alice })).rapid).toBe(1510);
    expect((await caller.players.forEdit({ id: bruno })).rapid).toBe(1504);
    await expectChainInSync(alice);
    await expectChainInSync(bruno);

    await caller.playersTournament.linkWithRating({ playerId: alice, tournamentId: wrong, variation: 11, ratingType: "rapid" });
    expect((await caller.players.forEdit({ id: alice })).rapid).toBe(1521);
  });

  test("rejects a correction that would push the rating out of range, changing nothing", async () => {
    const playerId = await createPlayer("Limite Um");
    const tournamentId = await createTournament("Limite 1");
    const resultId = await apply(playerId, tournamentId, 10);

    await expect(caller.playersTournament.correctVariation({ id: resultId, variation: -1600 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect((await caller.players.forEdit({ id: playerId })).rapid).toBe(1510);
    await expectChainInSync(playerId);
  });
});

describe("public rating history", () => {
  test("the profile lists results in the order they were applied", async () => {
    const playerId = await createPlayer("Ordem Um");
    const newer = await createTournament("Ordem Recente");
    const older = await createTournament("Ordem Antigo");
    await apply(playerId, newer, 4);
    await apply(playerId, older, 6);

    const profile = await caller.players.byId({ id: playerId });
    expect(profile.playersToTournaments.map((row) => [row.tournament.name, row.oldRating])).toEqual([
      ["Ordem Recente", 1500],
      ["Ordem Antigo", 1504],
    ]);
  });
});

describe("rating history rollback", () => {
  test("a correction that breaks a later result's range rolls back the whole batch", async () => {
    const playerId = await createPlayer("Rollback Um");
    const first = await createTournament("Rollback 1");
    const second = await createTournament("Rollback 2");
    const firstResult = await apply(playerId, first, 2495);
    await apply(playerId, second, -2000);
    const before = await caller.playersTournament.listByPlayer({ playerId });

    // The current rating (1995 → 2005) passes the API's pre-check; only the
    // database CHECK on the later row's old_rating (3995 → 4005) rejects it.
    await expect(caller.playersTournament.correctVariation({ id: firstResult, variation: 2505 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect((await caller.players.forEdit({ id: playerId })).rapid).toBe(1995);
    expect(await caller.playersTournament.listByPlayer({ playerId })).toEqual(before);
    await expectChainInSync(playerId);
  });
});

describe("guards against orphaned rating history", () => {
  test("a tournament with results cannot be deleted or change rating type until they are reverted", async () => {
    const playerId = await createPlayer("Guarda Um");
    const tournamentId = await createTournament("Guarda 1");
    await apply(playerId, tournamentId, 10);

    await expect(caller.tournaments.delete({ id: tournamentId })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller.tournaments.update({ id: tournamentId, ratingType: "blitz" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await caller.tournaments.update({ id: tournamentId, ratingType: "rapid", name: "Guarda 1 (renomeado)" });

    await caller.playersTournament.revertTournament({ tournamentId });
    await caller.tournaments.update({ id: tournamentId, ratingType: "blitz" });
    await caller.tournaments.delete({ id: tournamentId });
    expect((await caller.players.forEdit({ id: playerId })).rapid).toBe(1500);
  });

  test("a club with School Games results cannot be deleted", async () => {
    const clubId = idOf(await caller.clubs.create({ name: "Escola Guarda" }));
    const resultId = idOf(await caller.tvSergipe.create({
      clubId,
      teamName: "A",
      ageGroup: "10",
      sex: "male",
      modality: "team",
      place: 1,
    }));

    await expect(caller.clubs.delete({ id: clubId })).rejects.toMatchObject({ code: "CONFLICT" });
    await caller.tvSergipe.delete({ id: resultId });
    await caller.clubs.delete({ id: clubId });
  });
});
