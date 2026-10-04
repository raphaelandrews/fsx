import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { rankingSnapshots } from "@fsx/db/schema/rankingSnapshots";
import { tournaments } from "@fsx/db/schema/tournaments";

import { PLAYER_RESULTS_LIMIT } from "./gamification/constants";
import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let miniflare: Miniflare;
let db: ReturnType<typeof createDb>;
let caller: AdminCaller;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-gamification");
  miniflare = d1.miniflare;
  db = createDb(d1.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;

// Writes a +1 rapid chain directly: the rating import itself is covered by
// rating-history tests, and hundreds of imports would make this test slow.
async function playerWithResults(name: string, count: number) {
  const [player] = await db
    .insert(players)
    .values({ name, rapid: 1900 + count, active: true })
    .returning({ id: players.id });
  // D1 binds at most 100 parameters per statement, hence chunks of 20 rows.
  const created: { id: number }[] = [];
  for (let i = 0; i < count; i += 20) {
    created.push(
      ...(await db
        .insert(tournaments)
        .values(
          Array.from({ length: Math.min(20, count - i) }, (_, j) => ({
            name: `${name} ${i + j + 1}`,
            ratingType: "rapid",
            date: "2025-01-01",
          })),
        )
        .returning({ id: tournaments.id })),
    );
  }
  for (let i = 0; i < count; i += 20) {
    await db.insert(playersToTournaments).values(
      created.slice(i, i + 20).map((tournament, j) => ({
        playerId: player!.id,
        tournamentId: tournament.id,
        oldRating: 1900 + i + j,
        variation: 1,
        ratingType: "rapid",
      })),
    );
  }
  return player!.id;
}

describe("players.stats", () => {
  test("returns NOT_FOUND for an unknown player", async () => {
    await expect(caller.players.stats({ id: 999_999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("a player without history has empty stats", async () => {
    const id = idOf(await caller.players.create({ name: "Sem Histórico", blitz: 1900, rapid: 1900, classic: 1900, sex: "female" }));
    const { stats, achievements } = await caller.players.stats({ id });
    expect(stats.tournamentsPlayed).toBe(0);
    expect(stats.formats).toEqual({ classic: null, rapid: null, blitz: null });
    expect(achievements).toEqual([]);
  });

  test("counts a whole career beyond the profile's nested cap", async () => {
    const id = await playerWithResults("Veterano", 150);
    const { stats, achievements } = await caller.players.stats({ id });
    expect(stats.tournamentsPlayed).toBe(150);
    expect(stats.formats.rapid).toMatchObject({ results: 150, bestStreak: 150, peak: { rating: 2050 } });
    expect(achievements.map((a) => a.id)).toContain("tournaments-100");
    expect(achievements.map((a) => a.id)).toContain("rating-rapid-2000");
  });

  test("a player at the results limit still gets exact stats", async () => {
    const id = await playerWithResults("Limite", PLAYER_RESULTS_LIMIT);
    const { stats } = await caller.players.stats({ id });
    expect(stats.formats.rapid).toMatchObject({ results: PLAYER_RESULTS_LIMIT, peak: { rating: 1900 + PLAYER_RESULTS_LIMIT } });
  });

  test("combines rating results, tournament podiums, and finished circuit seasons", async () => {
    const playerId = idOf(await caller.players.create({ name: "Campeã", blitz: 1900, rapid: 1900, classic: 1900, sex: "female" }));
    const championshipId = idOf(await caller.champions.create({ name: "Campeonato Sergipano Feminino" }));
    for (const year of [2024, 2025]) {
      const tournamentId = idOf(
        await caller.tournaments.create({ name: `Sergipano Feminino ${year}`, ratingType: "classic", date: `${year}-08-01`, tier: "S", championshipId }),
      );
      await caller.tournamentPodiums.create({ playerId, tournamentId, place: 1 });
      await caller.playersTournament.linkWithRating({ playerId, tournamentId, variation: 60, ratingType: "classic" });
    }
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Feminino 2025", type: "default", year: 2025 }));
    const stageId = idOf(
      await caller.circuits.phases.create({
        circuitId,
        tournamentId: idOf(await caller.tournaments.create({ name: "Etapa Feminina", ratingType: "rapid", date: "2025-03-01" })),
        sortOrder: 1,
      }),
    );
    await caller.circuits.podiums.create({ playerId, circuitPhaseId: stageId, place: 2, points: 8 });
    await caller.circuits.finish({ id: circuitId, finishedAt: "2025-12-01" });

    const { stats, achievements, level } = await caller.players.stats({ id: playerId });
    expect(stats.tournamentsPlayed).toBe(3);
    expect(stats.medals).toEqual({
      tournament: { gold: 2, silver: 0, bronze: 0 },
      tournamentCategory: { gold: 0, silver: 0, bronze: 0 },
      circuitFinal: { gold: 1, silver: 0, bronze: 0 },
      circuitStage: { gold: 0, silver: 1, bronze: 0 },
    });
    expect(stats.formats.classic!.thresholds.map((t) => [t.threshold, t.earnedAt])).toEqual([[2000, "2025-08-01"]]);
    expect(achievements.find((a) => a.family === "dynasty")?.label).toBe("Bicampeão(ã) · Campeonato Sergipano Feminino");
    // 3 tournaments, two tier-S wins, a tier-B circuit title and a stage 2nd, 2000 in classic.
    expect(level).toEqual({
      level: 3,
      xp: 45 + 120 + 30 + 30,
      levelXp: 150,
      nextLevelXp: 300,
      breakdown: { tournaments: 45, tournamentPodiums: 120, circuitPodiums: 20 + 10, ratingThresholds: 30, titles: 0 },
    });
  });
});

describe("players.circuitSeasons", () => {
  test("returns NOT_FOUND for an unknown player", async () => {
    await expect(caller.players.circuitSeasons({ id: 999_999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("a season in progress gives a live position and no final podium", async () => {
    const [ana, bia] = await Promise.all(
      ["Ana Circuito", "Bia Circuito"].map(async (name) =>
        idOf(await caller.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "female" })),
      ),
    );
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Aberto 2026", type: "categories", year: 2026 }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Circuito Aberto · Etapa 1", ratingType: "rapid" }));
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    await caller.circuits.podiums.create({ playerId: ana!, circuitPhaseId, points: 5, category: "Sub 18 Feminino" });
    await caller.circuits.podiums.create({ playerId: bia!, circuitPhaseId, points: 9, category: "Sub 18 Feminino" });

    const [season] = await caller.players.circuitSeasons({ id: ana! });
    expect(season).toMatchObject({
      circuit: { id: circuitId, finishedAt: null },
      stagesPlayed: 1,
      points: 5,
      standings: [{ category: "Sub 18 Feminino", position: 2, players: 2 }],
      finalPodiums: [],
    });
    expect((await caller.players.stats({ id: ana! })).stats.medals.circuitFinal).toEqual({ gold: 0, silver: 0, bronze: 0 });

    await caller.circuits.finish({ id: circuitId, finishedAt: "2026-12-01" });
    const finalPodium = (await caller.circuits.byId({ id: circuitId })).circuitFinalPodiums.find((p) => p.playerId === ana)!;
    await caller.circuits.finalPodiums.update({ id: finalPodium.id, playerId: ana!, category: "Sub 18 Feminino", place: 1, points: 5 });

    const [finished] = await caller.players.circuitSeasons({ id: ana! });
    expect(finished!.standings).toEqual([]);
    expect(finished!.finalPodiums).toEqual([{ category: "Sub 18 Feminino", place: 1 }]);
    expect((await caller.players.stats({ id: ana! })).stats.medals.circuitFinal.gold).toBe(1);
  });
});

describe("upcoming achievements", () => {
  test("lists the next tournaments milestone and the next rating step per format played", async () => {
    const id = await playerWithResults("Iniciante", 3);
    const { upcoming, tournaments } = await caller.players.stats({ id });
    expect(upcoming.map((a) => [a.id, a.description])).toEqual([
      ["tournaments-10", "Faltam 7 torneios."],
      ["rating-rapid-2000", "Faltam 97 pontos acima do seu melhor rating rápido."],
    ]);
    expect(Object.values(tournaments).map((t) => t.name)).toContain("Iniciante 1");
  });
});

describe("title tiers", () => {
  test("are validated to 1–4", async () => {
    const id = idOf(await caller.titles.create({ name: "Grande Mestre Teste", shortName: "GMT", type: "internal", tier: 4 }));
    expect((await caller.titles.list()).find((title) => title.id === id)?.tier).toBe(4);
    await expect(caller.titles.update({ id, tier: 5 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.titles.update({ id, tier: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("playersTournament.snapshotRankings", () => {
  test("writes one ranked row per active player and imported format", async () => {
    await db.delete(rankingSnapshots);
    const active = (await db.query.players.findMany({ where: (p, { eq }) => eq(p.active, true), columns: { id: true } })).length;
    const [, , inactive] = await db
      .insert(players)
      .values([
        { name: "Empate A", blitz: 3000, active: true },
        { name: "Empate B", blitz: 3000, active: true },
        { name: "Inativo", blitz: 3500, active: false },
      ])
      .returning({ id: players.id });

    const { snapshotAt } = await caller.playersTournament.snapshotRankings({ ratingTypes: ["blitz", "rapid", "blitz"] });

    const rows = await db.query.rankingSnapshots.findMany();
    expect(rows).toHaveLength((active + 2) * 2);
    expect(new Set(rows.map((row) => row.snapshotAt))).toEqual(new Set([snapshotAt]));
    const blitzTop = rows.filter((row) => row.ratingType === "blitz" && row.rating === 3000);
    expect(blitzTop.map((row) => row.position)).toEqual([1, 1]);
    expect(rows.some((row) => row.playerId === inactive!.id)).toBe(false);
    expect(rows.find((row) => row.ratingType === "blitz" && row.position === 3)).toBeDefined();
  });

  test("rejects an empty list of formats", async () => {
    await expect(caller.playersTournament.snapshotRankings({ ratingTypes: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
