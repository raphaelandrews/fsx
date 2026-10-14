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
