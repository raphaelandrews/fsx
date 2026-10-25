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
let clubId: number;
let players: number[] = [];

const idOf = (rows: { id: number }[]) => rows[0]!.id;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-school-games");
  miniflare = d1.miniflare;
  binding = d1.binding;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
  clubId = idOf(await caller.clubs.create({ name: "Escola Modelo" }));
  players = await Promise.all(
    ["Ana", "Bruno", "Carla"].map(async (name) =>
      idOf(await caller.players.create({ name, blitz: 1500, rapid: 1500, classic: 1500, sex: "female" })),
    ),
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

const edition = async (name: string, date?: string) =>
  idOf(await caller.tournaments.create({ name, ratingType: "rapid", tier: "school", date }));

const podiumsOf = async (tournamentId: number) =>
  (await caller.tournamentPodiums.listByTournament({ tournamentId })).map(({ playerId, place, category }) => ({
    playerId,
    place,
    category,
  }));

describe("School Games editions", () => {
  test("individual places 1-3 become podiums in the age and sex category, and follow edits", async () => {
    const tournamentId = await edition("TV Sergipe 2027");
    const base = { tournamentId, clubId, ageGroup: "10", sex: "female", modality: "individual" } as const;

    const first = idOf(await caller.tvSergipe.create({ ...base, playerId: players[0]!, place: 1 }));
    await caller.tvSergipe.create({ ...base, playerId: players[1]!, place: 4 });
    await caller.tvSergipe.create({ ...base, modality: "team", teamName: "A", place: 2 });
    expect(await podiumsOf(tournamentId)).toEqual([{ playerId: players[0]!, place: 1, category: "Sub 10 Feminino" }]);

    await caller.tvSergipe.update({ ...base, id: first, playerId: players[0]!, place: 3 });
    expect(await podiumsOf(tournamentId)).toEqual([{ playerId: players[0]!, place: 3, category: "Sub 10 Feminino" }]);

    await caller.tvSergipe.update({ ...base, id: first, playerId: players[0]!, place: 5 });
    expect(await podiumsOf(tournamentId)).toEqual([]);

    await caller.tvSergipe.update({ ...base, id: first, playerId: players[0]!, place: 2 });
    await caller.tvSergipe.delete({ id: first });
    expect(await podiumsOf(tournamentId)).toEqual([]);
  });

  test("points default to the place but can be overridden, and the same player can compete in each edition", async () => {
    const first = await edition("TV Sergipe 2027 pontos");
    const second = await edition("TV Sergipe 2028 pontos");
    const base = { clubId, playerId: players[2]!, ageGroup: "12", sex: "female", modality: "individual", place: 2 } as const;

    await caller.tvSergipe.create({ ...base, tournamentId: first });
    await caller.tvSergipe.create({ ...base, tournamentId: second, points: 15 });
    await expect(caller.tvSergipe.create({ ...base, tournamentId: second })).rejects.toMatchObject({ code: "CONFLICT" });

    const points = async (tournamentId: number) =>
      (await caller.tvSergipe.list({ tournamentId })).map((result) => result.points);
    expect(await points(first)).toEqual([8]);
    expect(await points(second)).toEqual([15]);
    expect((await caller.tvSergipe.leaderboard({ tournamentId: second }))[0]!.points).toBe(15);
    expect((await caller.tvSergipe.editions()).map((e) => e.name)).toEqual(
      expect.arrayContaining(["TV Sergipe 2027 pontos", "TV Sergipe 2028 pontos"]),
    );
  });

  test("synced podiums are read-only, and a tournament with results cannot be deleted", async () => {
    const tournamentId = await edition("TV Sergipe 2029");
    await caller.tvSergipe.create({
      tournamentId,
      clubId,
      playerId: players[0]!,
      ageGroup: "14",
      sex: "female",
      modality: "individual",
      place: 1,
    });
    const [podium] = await caller.tournamentPodiums.listByTournament({ tournamentId });
    await expect(caller.tournamentPodiums.delete({ id: podium!.id })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller.tournaments.delete({ id: tournamentId })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("results saved before editions existed can be assigned to one, which syncs their podiums", async () => {
    await binding
      .prepare(
        "INSERT INTO tv_sergipe (club_id, player_id, age_group, sex, modality, place, points) VALUES (?, ?, '16', 'female', 'individual', 1, 10)",
      )
      .bind(clubId, players[1]!)
      .run();
    const tournamentId = await edition("TV Sergipe 2026");

    await caller.tvSergipe.assignEdition({ tournamentId });
    expect(await podiumsOf(tournamentId)).toEqual([{ playerId: players[1]!, place: 1, category: "Sub 16 Feminino" }]);
    await expect(caller.tvSergipe.assignEdition({ tournamentId })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("bulk results store several places at once with the edition's points and sync the individual medals", async () => {
    const schemeId = idOf(await caller.scoringSchemes.create({ name: "Bulk 5-3-1", places: [{ place: 1, points: 5 }, { place: 2, points: 3 }, { place: 3, points: 1 }] }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "TV Sergipe bulk", ratingType: "rapid", tier: "school", scoringSchemeId: schemeId }));
    const clubB = idOf(await caller.clubs.create({ name: "Escola Bulk B" }));

    await caller.tvSergipe.createMany({
      tournamentId,
      ageGroup: "14",
      sex: "male",
      modality: "individual",
      results: [
        { clubId, playerId: players[0]!, place: 1 },
        { clubId: clubB, playerId: players[1]!, place: 2, points: 4 },
      ],
    });
    await caller.tvSergipe.createMany({
      tournamentId,
      ageGroup: "14",
      sex: "male",
      modality: "team",
      results: [{ clubId, teamName: "A", place: 1 }],
    });

    const results = await caller.tvSergipe.list({ tournamentId });
    expect(results.map((result) => [result.modality, result.place, result.points]).sort()).toEqual([
      ["individual", 1, 5],
      ["individual", 2, 4],
      ["team", 1, 5],
    ]);
    expect((await caller.tournamentPodiums.listByTournament({ tournamentId })).map((podium) => [podium.place, podium.category])).toEqual([
      [1, "Sub 14 Masculino"],
      [2, "Sub 14 Masculino"],
    ]);
    await expect(
      caller.tvSergipe.createMany({
        tournamentId,
        ageGroup: "12",
        sex: "male",
        modality: "individual",
        results: [{ clubId, playerId: players[0]!, place: 1 }, { clubId, playerId: players[0]!, place: 2 }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.tvSergipe.createMany({
        tournamentId,
        ageGroup: "12",
        sex: "male",
        modality: "individual",
        results: [{ clubId, place: 1 }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
