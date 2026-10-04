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
let players: number[] = [];

beforeAll(async () => {
  const d1 = await createTestD1("fsx-circuits");
  miniflare = d1.miniflare;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
  players = await Promise.all(
    ["Ana", "Bruno", "Carla", "Davi"].map(async (name) =>
      idOf(await caller.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male" })),
    ),
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;

async function schoolCircuit(name: string) {
  const circuitId = idOf(await caller.circuits.create({ name, type: "school", year: 2026, tier: "school" }));
  const tournamentId = idOf(await caller.tournaments.create({ name: `${name} · Etapa 1`, ratingType: "rapid", tier: "school" }));
  const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
  const points = [
    [players[0]!, 10, "Sub 18 Masculino"],
    [players[1]!, 10, "Sub 18 Masculino"],
    [players[2]!, 7, "Sub 18 Masculino"],
    [players[3]!, 9, "Sub 16 Masculino"],
  ] as const;
  for (const [playerId, value, category] of points) {
    await caller.circuits.podiums.create({ playerId, circuitPhaseId, points: value, category });
  }
  return circuitId;
}

describe("circuit seasons", () => {
  test("finishing snapshots a podium per category, with shared places for ties", async () => {
    const id = await schoolCircuit("Circuito Escolar 2026");
    await caller.circuits.finish({ id, finishedAt: "2026-11-30" });

    const circuit = await caller.circuits.byId({ id });
    expect(circuit.finishedAt).toBe("2026-11-30");
    expect(
      circuit.circuitFinalPodiums.map(({ playerId, category, place, points }) => ({ playerId, category, place, points })),
    ).toEqual([
      { playerId: players[3]!, category: "Sub 16 Masculino", place: 1, points: 9 },
      { playerId: players[0]!, category: "Sub 18 Masculino", place: 1, points: 10 },
      { playerId: players[1]!, category: "Sub 18 Masculino", place: 1, points: 10 },
      { playerId: players[2]!, category: "Sub 18 Masculino", place: 3, points: 7 },
    ]);

    await expect(caller.circuits.finish({ id, finishedAt: "2026-12-01" })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller.circuits.delete({ id })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("final podiums can be corrected while finished, and reopening clears them", async () => {
    const id = await schoolCircuit("Circuito Escolar 2027");
    await expect(
      caller.circuits.finalPodiums.create({ circuitId: id, playerId: players[0]!, place: 1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await caller.circuits.finish({ id, finishedAt: "2027-11-30" });
    const tie = (await caller.circuits.byId({ id })).circuitFinalPodiums.find(
      (podium) => podium.playerId === players[1],
    )!;
    await caller.circuits.finalPodiums.update({ id: tie.id, playerId: players[1]!, category: "Sub 18 Masculino", place: 2, points: 10 });
    await expect(
      caller.circuits.finalPodiums.create({ circuitId: id, playerId: players[0]!, category: "Sub 18 Masculino", place: 1 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await caller.circuits.byId({ id })).circuitFinalPodiums.find((podium) => podium.id === tie.id)?.place).toBe(2);

    await caller.circuits.reopen({ id });
    const reopened = await caller.circuits.byId({ id });
    expect(reopened.finishedAt).toBeNull();
    expect(reopened.circuitFinalPodiums).toEqual([]);
    await caller.circuits.delete({ id });
  });

  test("a circuit without points cannot be finished", async () => {
    const id = idOf(await caller.circuits.create({ name: "Circuito Vazio", type: "default", year: 2026 }));
    await expect(caller.circuits.finish({ id, finishedAt: "2026-11-30" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("seasons list newest first", async () => {
    await caller.circuits.create({ name: "Circuito Antigo", type: "geral", year: 2020 });
    const years = (await caller.circuits.listSimple()).map((circuit) => circuit.year);
    expect(years).toEqual([...years].sort((a, b) => (b ?? 0) - (a ?? 0)));
  });
});

describe("tournament podium categories", () => {
  test("a player can hold an overall and a category podium, but not two of the same", async () => {
    const championshipId = idOf(await caller.champions.create({ name: "Campeonato Sergipano Rápido" }));
    const tournamentId = idOf(
      await caller.tournaments.create({ name: "Sergipano Rápido 2026", ratingType: "rapid", tier: "S", championshipId }),
    );
    const playerId = players[0]!;

    await caller.tournamentPodiums.create({ playerId, tournamentId, place: 2 });
    await caller.tournamentPodiums.create({ playerId, tournamentId, place: 1, category: "Sub 18 Masculino" });
    await expect(caller.tournamentPodiums.create({ playerId, tournamentId, place: 3 })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      caller.tournamentPodiums.create({ playerId, tournamentId, place: 1, category: "Sub 18 Masculino" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const gallery = await caller.champions.gallery();
    const podiums = gallery.find((entry) => entry.name === "Campeonato Sergipano Rápido")!.tournaments[0]!.tournamentPodiums;
    expect(podiums.map((podium) => podium.place)).toEqual([2]);
    expect((await caller.tournaments.byId({ id: tournamentId })).tier).toBe("S");
  });
});
