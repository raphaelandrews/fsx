import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";
import { changeLog } from "@fsx/db/schema/change-log";

import { diffValues } from "./services/change-log";
import { callerAs, ownerCaller, type AdminCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let admin: AdminCaller;
let visitor: AdminCaller;
let db: ReturnType<typeof createDb>;
let dispose: () => Promise<void>;

const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;
const historyOf = (entity: "player" | "tournament" | "podium", recordId: number) => admin.history.list({ page: 1, entity, recordId });

beforeAll(async () => {
  const test = await createTestD1("fsx-change-log");
  db = createDb(test.binding);
  admin = await ownerCaller(appRouter.createCaller, db);
  visitor = callerAs(appRouter.createCaller, db, null);
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  await dispose();
});

describe("diffValues", () => {
  test("keeps only the fields that changed", () => {
    expect(diffValues({ a: 1, b: "x", c: null }, { a: 1, b: "y", c: 3 })).toEqual({ b: ["x", "y"], c: [null, 3] });
    expect(diffValues(null, { a: 1 })).toEqual({ a: [null, 1] });
    expect(diffValues({ a: 1 }, null)).toEqual({ a: [1, null] });
  });
});

describe("the change history", () => {
  test("records a player's creation, edits and bulk changes with before and after values", async () => {
    const id = idOf(await admin.players.create({ name: "Historiada", blitz: 1900, rapid: 1900, classic: 1900, sex: "female" }));
    await admin.players.update({ id, rapid: 1950, nickname: "Histo" });
    await admin.players.update({ id, rapid: 1950 });
    await admin.players.bulkSetActive({ ids: [id], active: true });

    const { entries } = await historyOf("player", id);
    expect(entries.map((entry) => [entry.action, entry.procedure])).toEqual([
      ["update", "players.bulkSetActive"],
      ["update", "players.update"],
      ["create", "players.create"],
    ]);
    expect(entries[0]!.changes).toEqual({ active: [false, true] });
    expect(entries[1]!.changes).toEqual({ rapid: [1900, 1950], nickname: [null, "Histo"] });
    expect(entries[2]!.changes.name).toEqual([null, "Historiada"]);
    expect(entries[2]).toMatchObject({ label: "Historiada", actor: expect.any(String), entity: "player" });
  });

  test("keeps a deleted record's history, with what it held", async () => {
    const tournament = idOf(await admin.tournaments.create({ name: "Torneio Apagado", ratingType: "rapid", date: "2030-01-01" }));
    await admin.tournaments.update({ id: tournament, name: "Torneio Renomeado" });
    await admin.tournaments.delete({ id: tournament });

    const { entries } = await historyOf("tournament", tournament);
    expect(entries.map((entry) => entry.action)).toEqual(["delete", "update", "create"]);
    expect(entries[0]!.changes.name).toEqual(["Torneio Renomeado", null]);
    expect(entries[0]!.label).toBe("Torneio Renomeado");
  });

  test("labels podiums with the player and tournament, and logs each bulk-deleted one", async () => {
    const player = idOf(await admin.players.create({ name: "Podiada", blitz: 1900, rapid: 1900, classic: 1900, sex: "male" }));
    const tournament = idOf(await admin.tournaments.create({ name: "Aberto do Pódio", ratingType: "rapid" }));
    const [first, second] = (await admin.tournamentPodiums.createMany({ tournamentId: tournament, podiums: [{ playerId: player, place: 1 }, { playerId: player, place: 2, category: "Sub 18 Masculino" }] })).map((row) => row.id);
    await admin.tournamentPodiums.bulkDelete({ ids: [first!, second!] });

    const entries = (await historyOf("podium", first!)).entries;
    expect(entries.map((entry) => entry.action)).toEqual(["delete", "create"]);
    expect(entries[0]!.label).toBe("Podiada · Aberto do Pódio");
    expect(entries[0]!.procedure).toBe("tournamentPodiums.bulkDelete");
  });

  test("only an administrator reads it, and failed or no-op calls leave nothing", async () => {
    await expect(visitor.history.list({ page: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const before = (await admin.history.list({ page: 1 })).pagination.totalItems;
    await expect(admin.tournaments.update({ id: 999999, name: "Fantasma" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await admin.history.list({ page: 1 })).pagination.totalItems).toBe(before);
  });

  test("drops entries older than the retention period on the next write", async () => {
    await db.insert(changeLog).values({ actor: "x", entity: "player", recordId: 424242, label: "Antigo", action: "update", procedure: "players.update", changes: "{}", createdAt: "2020-01-01 00:00:00" });
    expect((await historyOf("player", 424242)).entries).toHaveLength(1);
    const id = idOf(await admin.players.create({ name: "Dispara Retenção", blitz: 1900, rapid: 1900, classic: 1900, sex: "male" }));
    expect(id).toBeGreaterThan(0);
    expect((await historyOf("player", 424242)).entries).toHaveLength(0);
  });
});

describe("change log with many records", () => {
  test("records every player of a bulk action beyond one insert's parameter budget", async () => {
    const created: number[] = [];
    for (let i = 0; i < 30; i++) created.push(idOf(await admin.players.create({ name: `Registro ${i}`, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true })));
    await admin.players.bulkSetActive({ ids: created, active: false });
    for (const id of created) {
      const entries = await historyOf("player", id);
      expect(entries.entries.some((entry) => entry.procedure === "players.bulkSetActive")).toBe(true);
    }
  });
});
