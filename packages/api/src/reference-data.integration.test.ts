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
let clubId: number;
let players: number[] = [];

const idOf = (rows: { id: number }[]) => rows[0]!.id;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-reference-data");
  miniflare = d1.miniflare;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
  clubId = idOf(await caller.clubs.create({ name: "Escola Referência" }));
  players = await Promise.all(
    ["Ana", "Bruno"].map(async (name) =>
      idOf(await caller.players.create({ name, blitz: 1500, rapid: 1500, classic: 1500, sex: "female" })),
    ),
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

const tournament = async (name: string, scoringSchemeId?: number) =>
  idOf(await caller.tournaments.create({ name, ratingType: "rapid", tier: "school", scoringSchemeId }));

describe("categories", () => {
  test("the migration seeds the 15 categories in display order", async () => {
    const list = await caller.categories.list();
    expect(list).toHaveLength(15);
    expect(list.slice(0, 2).map((category) => category.name)).toEqual(["Sub 8 Masculino", "Sub 10 Masculino"]);
    expect(list.filter((category) => category.kind === "open").map((category) => category.name)).toEqual(["Futuro", "Juvenil", "Master"]);
  });

  test("an age category needs a sex and an age limit, and an open one has neither", async () => {
    const base = { name: "Sub 20 Masculino", sortOrder: 99 };
    await expect(caller.categories.create({ ...base, kind: "age" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.categories.create({ ...base, kind: "open", sex: "male" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await caller.categories.create({ ...base, kind: "age", sex: "male", ageLimit: 20 });
    await expect(caller.categories.create({ ...base, kind: "age", sex: "male", ageLimit: 20 })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("podiums and results only accept known categories, and a rename follows them", async () => {
    const tournamentId = await tournament("Torneio Categorias");
    await expect(
      caller.tournamentPodiums.create({ playerId: players[0]!, tournamentId, place: 1, category: "Sub 99" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await caller.tournamentPodiums.create({ playerId: players[0]!, tournamentId, place: 1, category: "Master" });

    const master = (await caller.categories.list()).find((category) => category.name === "Master")!;
    await caller.categories.update({ id: master.id, name: "Master 40+", kind: "open", sortOrder: master.sortOrder });
    expect((await caller.tournamentPodiums.listByTournament({ tournamentId })).map((podium) => podium.category)).toEqual(["Master 40+"]);

    await expect(caller.categories.delete({ id: master.id })).rejects.toMatchObject({ code: "CONFLICT" });
    const [podium] = await caller.tournamentPodiums.listByTournament({ tournamentId });
    await caller.tournamentPodiums.delete({ id: podium!.id });
    await caller.categories.delete({ id: master.id });
  });

  test("a School Games result gets no podium when its age category does not exist", async () => {
    const tournamentId = await tournament("TV Sergipe categorias");
    const sub8 = (await caller.categories.list()).find((category) => category.name === "Sub 8 Feminino")!;
    await caller.categories.delete({ id: sub8.id });

    await caller.tvSergipe.create({
      tournamentId,
      clubId,
      playerId: players[1]!,
      ageGroup: "8",
      sex: "female",
      modality: "individual",
      place: 1,
    });
    expect(await caller.tournamentPodiums.listByTournament({ tournamentId })).toEqual([]);
  });
});

describe("scoring schemes", () => {
  test("a scheme is created with its places, edited in place, and blocked from deletion while used", async () => {
    const created = await caller.scoringSchemes.create({
      name: "Top 3",
      places: [{ place: 1, points: 5 }, { place: 2, points: 3 }, { place: 3, points: 1 }],
    });
    const schemeId = created[0]!.id;
    await expect(
      caller.scoringSchemes.create({ name: "Top 3", places: [{ place: 1, points: 1 }] }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      caller.scoringSchemes.create({ name: "Repetido", places: [{ place: 1, points: 1 }, { place: 1, points: 2 }] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await caller.scoringSchemes.list()).some((scheme) => scheme.name === "Repetido")).toBe(false);

    await caller.scoringSchemes.update({ id: schemeId, name: "Top 3 (2027)", places: [{ place: 1, points: 6 }, { place: 2, points: 4 }] });
    const scheme = (await caller.scoringSchemes.list()).find((entry) => entry.id === schemeId)!;
    expect(scheme.name).toBe("Top 3 (2027)");
    expect(scheme.places).toEqual([{ place: 1, points: 6 }, { place: 2, points: 4 }]);

    const circuitId = idOf(
      await caller.circuits.create({ name: "Circuito com esquema", type: "school", year: 2027, tier: "school", scoringSchemeId: schemeId }),
    );
    expect((await caller.circuits.byId({ id: circuitId })).scoringScheme).toEqual({
      id: schemeId,
      name: "Top 3 (2027)",
      places: [{ place: 1, points: 6 }, { place: 2, points: 4 }],
    });
    await expect(caller.scoringSchemes.delete({ id: schemeId })).rejects.toMatchObject({ code: "CONFLICT" });
    await caller.circuits.update({ id: circuitId, name: "Circuito com esquema", type: "school", year: 2027, tier: "school", scoringSchemeId: null });
    await caller.scoringSchemes.delete({ id: schemeId });
  });

  test("School Games points default to the edition's scheme, then to the original table, unless given", async () => {
    const schemeId = idOf(await caller.scoringSchemes.create({ name: "Dobro", places: [{ place: 1, points: 20 }, { place: 2, points: 16 }] }));
    const scored = await tournament("TV Sergipe com esquema", schemeId);
    const plain = await tournament("TV Sergipe sem esquema");
    const base = { clubId, playerId: players[0]!, ageGroup: "10", sex: "male", modality: "individual" } as const;

    await caller.tvSergipe.create({ ...base, tournamentId: scored, place: 2 });
    await caller.tvSergipe.create({ ...base, tournamentId: plain, place: 2 });
    await caller.tvSergipe.create({ ...base, tournamentId: scored, ageGroup: "12", place: 1, points: 7 });
    const points = async (tournamentId: number) =>
      (await caller.tvSergipe.list({ tournamentId })).map((result) => [result.ageGroup, result.points]);
    expect(await points(scored)).toEqual([["10", 16], ["12", 7]]);
    expect(await points(plain)).toEqual([["10", 8]]);
  });
});
