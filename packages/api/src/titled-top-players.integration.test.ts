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
let publicCaller: ReturnType<typeof appRouter.createCaller>;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-titled-top");
  miniflare = d1.miniflare;
  const db = createDb(d1.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
  publicCaller = appRouter.createCaller({ db, session: null } as never);
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;

describe("titledPlayers.list and topPlayers.list", () => {
  test("are empty while there are no players", async () => {
    expect(await publicCaller.titledPlayers.list()).toEqual([]);
    expect(await publicCaller.topPlayers.list()).toEqual({ topClassic: [], topRapid: [], topBlitz: [] });
  });

  test("titled players come back with their titles, best rapid rating first", async () => {
    const titleId = idOf(await caller.titles.create({ name: "Mestre Sergipano", shortName: "MSE", type: "internal" }));
    const low = idOf(await caller.players.create({ name: "Ana Titulada", classic: 1500, rapid: 1600, blitz: 1500, sex: "female" }));
    const high = idOf(await caller.players.create({ name: "Bruno Titulado", classic: 1500, rapid: 1900, blitz: 1500, sex: "male" }));
    const untitled = idOf(await caller.players.create({ name: "Carlos Sem Título", classic: 1500, rapid: 2100, blitz: 1500, sex: "male" }));
    await caller.players.bulkSetActive({ ids: [low, high, untitled], active: true });
    await caller.playersToTitles.link({ playerId: low, titleId });
    await caller.playersToTitles.link({ playerId: high, titleId });

    const titled = await publicCaller.titledPlayers.list();
    expect(titled.map((player) => player.id)).toEqual([high, low]);
    expect(titled[0]!.playersToTitles.map((link) => link.title.shortName)).toEqual(["MSE"]);
  });

  test("the top lists hold active players only, ordered by each rating", async () => {
    const inactive = idOf(await caller.players.create({ name: "Dora Inativa", classic: 3000, rapid: 3000, blitz: 3000, sex: "female" }));
    await caller.players.bulkSetActive({ ids: [inactive], active: false });

    const { topClassic, topRapid, topBlitz } = await publicCaller.topPlayers.list();
    for (const list of [topClassic, topRapid, topBlitz]) expect(list.map((player) => player.id)).not.toContain(inactive);
    expect(topRapid.map((player) => player.name)).toEqual(["Carlos Sem Título", "Bruno Titulado", "Ana Titulada"]);
  });
});
