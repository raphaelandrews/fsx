import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";

import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let miniflare: Miniflare;
let binding: D1Database;
let caller: AdminCaller;
let players: number[] = [];

beforeAll(async () => {
  const d1 = await createTestD1("fsx-circuits");
  miniflare = d1.miniflare;
  binding = d1.binding;
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
    await caller.circuits.results.create({ playerId, circuitPhaseId, points: value, category });
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
  test("school stage places 1-3 sync to tournament podiums and follow edits", async () => {
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Escolar Sync", type: "school", year: 2026, tier: "school" }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Escolar Sync · Etapa 1", ratingType: "rapid", tier: "school" }));
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    const category = "Sub 10 Feminino";
    const podiumsOf = async () =>
      (await caller.tournamentPodiums.listByTournament({ tournamentId })).map(({ playerId, place, category }) => ({ playerId, place, category }));

    const first = idOf(await caller.circuits.results.create({ playerId: players[0]!, circuitPhaseId, points: 10, place: 1, category }));
    const fourth = idOf(await caller.circuits.results.create({ playerId: players[1]!, circuitPhaseId, points: 5, place: 4, category }));
    await caller.circuits.results.create({ playerId: players[2]!, circuitPhaseId, points: 4 });
    expect(await podiumsOf()).toEqual([{ playerId: players[0]!, place: 1, category }]);

    await caller.circuits.results.update({ id: fourth, playerId: players[1]!, circuitPhaseId, points: 8, place: 2, category });
    await caller.circuits.results.update({ id: first, playerId: players[0]!, circuitPhaseId, points: 3, place: 6, category });
    expect(await podiumsOf()).toEqual([{ playerId: players[1]!, place: 2, category }]);

    await caller.tournamentPodiums.create({ playerId: players[3]!, tournamentId, place: 3, category });
    await caller.circuits.results.create({ playerId: players[3]!, circuitPhaseId, points: 6, place: 3, category });
    expect(await podiumsOf()).toEqual([
      { playerId: players[1]!, place: 2, category },
      { playerId: players[3]!, place: 3, category },
    ]);

    await caller.circuits.results.delete({ id: fourth });
    expect(await podiumsOf()).toEqual([{ playerId: players[3]!, place: 3, category }]);

    const otherTournamentId = idOf(await caller.tournaments.create({ name: "Escolar Sync · Etapa 2", ratingType: "rapid", tier: "school" }));
    await caller.circuits.phases.update({ id: circuitPhaseId, tournamentId: otherTournamentId, sortOrder: 1 });
    expect(await podiumsOf()).toEqual([]);
    expect((await caller.tournamentPodiums.listByTournament({ tournamentId: otherTournamentId })).map((podium) => podium.place)).toEqual([3]);
    expect(await caller.circuits.phases.listByTournament({ tournamentId })).toEqual([]);
    expect(await caller.circuits.phases.listByTournament({ tournamentId: otherTournamentId })).toEqual([
      { id: circuitPhaseId, sortOrder: 1, circuit: { id: circuitId, name: "Circuito Escolar Sync", year: 2026 } },
    ]);
  });

  test("every circuit type gives stage medals unless the tournament has podiums turned off", async () => {
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Padrão Sync", type: "default", year: 2026, tier: "B" }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Padrão Sync · Etapa 1", ratingType: "rapid", tier: "B" }));
    expect((await caller.tournaments.byId({ id: tournamentId })).hasPodiums).toBe(true);
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    await caller.circuits.results.create({ playerId: players[0]!, circuitPhaseId, points: 10, place: 1 });
    expect((await caller.tournamentPodiums.listByTournament({ tournamentId })).map((podium) => podium.place)).toEqual([1]);

    await caller.tournaments.update({ id: tournamentId, hasPodiums: false });
    expect(await caller.tournamentPodiums.listByTournament({ tournamentId })).toEqual([]);
    await caller.circuits.results.create({ playerId: players[1]!, circuitPhaseId, points: 8, place: 2 });
    expect(await caller.tournamentPodiums.listByTournament({ tournamentId })).toEqual([]);
    await expect(
      caller.tournamentPodiums.create({ playerId: players[2]!, tournamentId, place: 1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await caller.circuits.syncPodiums({ id: circuitId });
    expect(await caller.tournamentPodiums.listByTournament({ tournamentId })).toEqual([]);

    await caller.tournaments.update({ id: tournamentId, hasPodiums: true });
    expect((await caller.tournamentPodiums.listByTournament({ tournamentId })).map((podium) => podium.place)).toEqual([1, 2]);
  });

  test("a tournament with hand-entered podiums cannot turn podiums off until they are removed", async () => {
    const tournamentId = idOf(await caller.tournaments.create({ name: "Torneio Manual Sync", ratingType: "rapid", tier: "B" }));
    await caller.tournamentPodiums.create({ playerId: players[0]!, tournamentId, place: 1 });
    await expect(caller.tournaments.update({ id: tournamentId, hasPodiums: false })).rejects.toMatchObject({ code: "CONFLICT" });
    const [podium] = await caller.tournamentPodiums.listByTournament({ tournamentId });
    await caller.tournamentPodiums.delete({ id: podium!.id });
    await caller.tournaments.update({ id: tournamentId, hasPodiums: false });
    expect((await caller.tournaments.byId({ id: tournamentId })).hasPodiums).toBe(false);
  });

  test("bulk stage results keep tied places and points, and sync only the medals", async () => {
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Escolar Bulk", type: "school", year: 2026, tier: "school" }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Escolar Bulk · Etapa 1", ratingType: "rapid", tier: "school" }));
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    const category = "Sub 12 Masculino";

    await caller.circuits.results.createMany({
      circuitPhaseId,
      category,
      results: [
        { playerId: players[0]!, place: 1, points: 10 },
        { playerId: players[1]!, place: 2, points: 8 },
        { playerId: players[2]!, place: 2, points: 8 },
        { playerId: players[3]!, place: 4, points: 5 },
      ],
    });

    const synced = await caller.tournamentPodiums.listByTournament({ tournamentId });
    expect(synced.map(({ playerId, place }) => ({ playerId, place }))).toEqual([
      { playerId: players[0]!, place: 1 },
      { playerId: players[1]!, place: 2 },
      { playerId: players[2]!, place: 2 },
    ]);
    expect((await caller.circuits.byId({ id: circuitId })).circuitPhases[0]!.circuitResults).toHaveLength(4);

    await expect(
      caller.circuits.results.createMany({
        circuitPhaseId,
        category,
        results: [{ playerId: players[0]!, points: 1 }, { playerId: players[0]!, points: 2 }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(
      caller.tournamentPodiums.update({ id: synced[0]!.id, tournamentId, playerId: players[0]!, place: 3, category }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller.tournamentPodiums.delete({ id: synced[0]!.id })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller.tournamentPodiums.bulkDelete({ ids: [synced[0]!.id] })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("a tournament shared by two circuits syncs one medal", async () => {
    const tournamentId = idOf(await caller.tournaments.create({ name: "Escolar Shared", ratingType: "rapid", tier: "school" }));
    const category = "Sub 14 Feminino";
    const circuitIds: number[] = [];
    for (const name of ["Circuito Escolar A", "Circuito Escolar B"]) {
      const circuitId = idOf(await caller.circuits.create({ name, type: "school", year: 2026, tier: "school" }));
      const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
      await caller.circuits.results.create({ playerId: players[0]!, circuitPhaseId, points: 10, place: 1, category });
      circuitIds.push(circuitId);
    }
    const podiums = async () => (await caller.tournamentPodiums.listByTournament({ tournamentId })).map(({ place }) => place);
    expect(await podiums()).toEqual([1]);

    await caller.circuits.syncPodiums({ id: circuitIds[1]! });
    expect(await podiums()).toEqual([1]);
  });
  test("the player profile carries the category played at each circuit stage", async () => {
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Histórico", type: "categories", year: 2026, tier: "B" }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Etapa 1", ratingType: "rapid", tier: "B" }));
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    await caller.circuits.results.create({ playerId: players[3]!, circuitPhaseId, points: 7, place: 5, category: "Sub 8 Feminino" });
    const profile = await caller.players.byId({ id: players[3]! });
    expect(profile.circuitResults.filter((result) => result.circuitPhases?.tournamentId === tournamentId).map((result) => result.category)).toEqual(["Sub 8 Feminino"]);
  });

  test("medalGaps counts stage medals missing a podium until they are synced", async () => {
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Lacunas", type: "default", year: 2026, tier: "B" }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Etapa Lacunas", ratingType: "rapid", tier: "B" }));
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    expect(await caller.circuits.medalGaps({ id: circuitId })).toEqual({ missing: 0 });

    // A result saved before the sync existed: written straight to the table, so it has no podium.
    await binding
      .prepare("INSERT INTO circuit_results (player_id, circuit_phase_id, place, points) VALUES (?, ?, 1, 10), (?, ?, 5, 3)")
      .bind(players[0]!, circuitPhaseId, players[1]!, circuitPhaseId)
      .run();
    expect(await caller.circuits.medalGaps({ id: circuitId })).toEqual({ missing: 1 });

    await caller.circuits.syncPodiums({ id: circuitId });
    expect(await caller.circuits.medalGaps({ id: circuitId })).toEqual({ missing: 0 });
    expect((await caller.tournamentPodiums.listByTournament({ tournamentId })).map((podium) => podium.place)).toEqual([1]);

    await caller.tournaments.update({ id: tournamentId, hasPodiums: false });
    expect(await caller.circuits.medalGaps({ id: circuitId })).toEqual({ missing: 0 });
  });

  test("a circuit with a category list accepts only those categories, and the list cannot drop a used one", async () => {
    const circuitId = idOf(
      await caller.circuits.create({
        name: "Circuito Lista",
        type: "categories",
        year: 2026,
        tier: "B",
        categories: ["Sub 8 Masculino", "Sub 8 Feminino"],
      }),
    );
    const circuit = async () => (await caller.circuits.byId({ id: circuitId })).circuitCategories.map((entry) => entry.category).sort();
    expect(await circuit()).toEqual(["Sub 8 Feminino", "Sub 8 Masculino"]);
    const tournamentId = idOf(await caller.tournaments.create({ name: "Etapa Lista", ratingType: "rapid", tier: "B", hasPodiums: false }));
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    const base = { playerId: players[0]!, circuitPhaseId, points: 5 };

    await caller.circuits.results.create({ ...base, category: "Sub 8 Feminino" });
    await caller.circuits.results.create({ ...base, playerId: players[1]! });
    await expect(caller.circuits.results.create({ ...base, category: "Sub 14 Masculino" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.circuits.results.createMany({ circuitPhaseId, category: "Master", results: [{ playerId: players[2]!, points: 1 }] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const [result] = (await caller.circuits.byId({ id: circuitId })).circuitPhases[0]!.circuitResults;
    await expect(
      caller.circuits.results.update({ id: result!.id, ...base, category: "Juvenil" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const settings = { id: circuitId, name: "Circuito Lista", type: "categories", year: 2026, tier: "B" } as const;
    await expect(caller.circuits.update({ ...settings, categories: ["Sub 8 Masculino"] })).rejects.toMatchObject({ code: "CONFLICT" });
    await caller.circuits.update({ ...settings, name: "Circuito Lista" });
    expect(await circuit()).toEqual(["Sub 8 Feminino", "Sub 8 Masculino"]);
    await caller.circuits.update({ ...settings, categories: ["Sub 8 Feminino", "Sub 8 Masculino", "Sub 10 Feminino"] });
    expect(await circuit()).toHaveLength(3);
    await caller.circuits.results.create({ ...base, playerId: players[2]!, category: "Sub 10 Feminino" });

    const sub10 = (await caller.categories.list()).find((category) => category.name === "Sub 10 Feminino")!;
    await expect(caller.categories.delete({ id: sub10.id })).rejects.toMatchObject({ code: "CONFLICT" });

    await caller.circuits.update({ ...settings, categories: [] });
    expect(await circuit()).toEqual([]);
    await caller.circuits.results.create({ ...base, playerId: players[3]!, category: "Sub 14 Masculino" });
  });

});

describe("a player who changes club during a circuit", () => {
  test("each result keeps the club the player had when it was saved", async () => {
    const clubA = idOf(await caller.clubs.create({ name: "Colégio A" }));
    const clubB = idOf(await caller.clubs.create({ name: "Colégio B" }));
    const moveTo = (clubId: number) => binding.prepare("UPDATE players SET club_id = ? WHERE id = ?").bind(clubId, players[0]!).run();

    const circuitId = idOf(await caller.circuits.create({ name: "Escolar Transferência", type: "school", year: 2026, tier: "school" }));
    const stage = async (order: number) =>
      idOf(await caller.circuits.phases.create({
        circuitId,
        tournamentId: idOf(await caller.tournaments.create({ name: `Transferência · Etapa ${order}`, ratingType: "rapid", tier: "school" })),
        sortOrder: order,
      }));
    const [first, second] = [await stage(1), await stage(2)];

    await moveTo(clubA);
    const firstResult = idOf(await caller.circuits.results.create({ playerId: players[0]!, circuitPhaseId: first, points: 10, category: "Sub 12 Masculino" }));
    await moveTo(clubB);
    await caller.circuits.results.create({ playerId: players[0]!, circuitPhaseId: second, points: 7, category: "Sub 12 Masculino" });
    await caller.circuits.results.update({ id: firstResult, playerId: players[0]!, circuitPhaseId: first, points: 12, category: "Sub 12 Masculino" });

    const clubOfStage = async () =>
      Object.fromEntries((await caller.circuits.byId({ id: circuitId })).circuitPhases.map((phase) => [phase.sortOrder, phase.circuitResults[0]!.club?.id]));
    expect(await clubOfStage()).toEqual({ 1: clubA, 2: clubB });

    await caller.circuits.results.update({ id: firstResult, playerId: players[0]!, circuitPhaseId: first, points: 12, category: "Sub 12 Masculino", clubId: clubB });
    expect((await clubOfStage())[1]).toBe(clubB);

    await moveTo(clubA);
    await expect(caller.clubs.delete({ id: clubB })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
