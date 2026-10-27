import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { callerAs, ownerCaller, type AdminCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let admin: AdminCaller;
let visitor: AdminCaller;
let dispose: () => Promise<void>;
let ids: number[];
let clubId: number;
let tournamentId: number;

const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;

beforeAll(async () => {
  const test = await createTestD1("fsx-bulk");
  const db = createDb(test.binding);
  admin = await ownerCaller(appRouter.createCaller, db);
  visitor = callerAs(appRouter.createCaller, db, null);
  dispose = () => test.miniflare.dispose();
  ids = [];
  for (const name of ["Lote A", "Lote B", "Lote C"]) {
    ids.push(idOf(await admin.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true })));
  }
  clubId = idOf(await admin.clubs.create({ name: "Clube do Lote" }));
  tournamentId = idOf(await admin.tournaments.create({ name: "Torneio do Lote", ratingType: "rapid" }));
});

afterAll(async () => {
  await dispose();
});

describe("bulk player actions", () => {
  test("deactivate and reactivate only the selected players", async () => {
    expect(await admin.players.bulkSetActive({ ids: [ids[0]!, ids[1]!, ids[0]!], active: false })).toEqual({ updated: 2, requested: 2 });
    expect((await admin.players.forEdit({ id: ids[0]! })).active).toBe(false);
    expect((await admin.players.forEdit({ id: ids[2]! })).active).toBe(true);
    await admin.players.bulkSetActive({ ids: [ids[0]!, ids[1]!], active: true });
    expect((await admin.players.forEdit({ id: ids[1]! })).active).toBe(true);
  });

  test("assign and clear a club", async () => {
    await admin.players.bulkSetClub({ ids: [ids[0]!, ids[2]!], clubId });
    expect((await admin.players.forEdit({ id: ids[2]! })).clubId).toBe(clubId);
    expect((await admin.players.forEdit({ id: ids[1]! })).clubId).toBeNull();
    await admin.players.bulkSetClub({ ids: [ids[0]!, ids[2]!], clubId: null });
    expect((await admin.players.forEdit({ id: ids[2]! })).clubId).toBeNull();
  });

  test("reports how many were found and rejects bad selections", async () => {
    expect(await admin.players.bulkSetActive({ ids: [ids[0]!, 999999], active: true })).toEqual({ updated: 1, requested: 2 });
    await expect(admin.players.bulkSetActive({ ids: [999998], active: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(admin.players.bulkSetClub({ ids: [ids[0]!], clubId: 999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(admin.players.bulkSetActive({ ids: [], active: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(admin.players.bulkSetActive({ ids: Array.from({ length: 91 }, (_, index) => index + 1), active: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("handles a full-size selection within D1's parameter limit", async () => {
    const many = [] as number[];
    for (let i = 0; i < 90; i++) many.push(idOf(await admin.players.create({ name: `Lote Cheio ${i}`, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true })));
    expect(await admin.players.bulkSetActive({ ids: many, active: false })).toEqual({ updated: 90, requested: 90 });
  });

  test("need an administrator", async () => {
    await expect(visitor.players.bulkSetActive({ ids: [ids[0]!], active: false })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(visitor.tournamentPodiums.bulkDelete({ ids: [1] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("bulk podium delete", () => {
  test("removes the selected podiums in one statement", async () => {
    const created = await admin.tournamentPodiums.createMany({
      tournamentId,
      podiums: [
        { playerId: ids[0]!, place: 1 },
        { playerId: ids[1]!, place: 2 },
        { playerId: ids[2]!, place: 3 },
      ],
    });
    const [first, second] = created.map((row) => row.id);
    expect(await admin.tournamentPodiums.bulkDelete({ ids: [first!, second!] })).toEqual({ deleted: 2, requested: 2 });
    expect((await admin.tournamentPodiums.listByTournament({ tournamentId })).map((row) => row.place)).toEqual([3]);
    await expect(admin.tournamentPodiums.bulkDelete({ ids: [first!] })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
