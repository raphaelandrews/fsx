import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let caller: Awaited<ReturnType<typeof ownerCaller>>;
let dispose: () => Promise<void>;

const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;

beforeAll(async () => {
  const test = await createTestD1("fsx-tournaments");
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  await dispose();
});

describe("deleting a tournament with podiums", () => {
  test("is refused", async () => {
    const tournament = idOf(
      await caller.tournaments.create({ name: "Com Pódio", ratingType: "rapid" }),
    );
    const player = idOf(
      await caller.players.create({
        name: "Podium Player",
        blitz: 1000,
        rapid: 1000,
        classic: 1000,
        sex: "male",
        active: true,
        verified: false,
      }),
    );
    await caller.tournamentPodiums.create({ playerId: player, tournamentId: tournament, place: 1 });
    await expect(caller.tournaments.delete({ id: tournament })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe("searching tournaments and clubs by name", () => {
  test("ignores accents and case on both sides", async () => {
    const tournament = idOf(await caller.tournaments.create({ name: "Copa São Paulo de Xadrez", ratingType: "rapid" }));
    const club = idOf(await caller.clubs.create({ name: "Clube Ação Rápida" }));

    expect((await caller.tournaments.search({ query: "sao paulo" })).map((row) => row.id)).toEqual([tournament]);
    expect((await caller.tournaments.search({ query: "SÃO xadrez" })).map((row) => row.id)).toEqual([tournament]);
    expect((await caller.clubs.search({ query: "acao rapida" })).map((row) => row.id)).toEqual([club]);
    expect((await caller.clubs.search({ query: "ação" })).map((row) => row.id)).toEqual([club]);
    expect(await caller.tournaments.search({ query: "inexistente" })).toEqual([]);
  });
});
