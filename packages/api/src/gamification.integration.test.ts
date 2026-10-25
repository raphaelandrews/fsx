import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";
import { cupBrackets } from "@fsx/db/schema/cup-brackets";
import { cupMatches } from "@fsx/db/schema/cup-matches";
import { cupPlayoffs } from "@fsx/db/schema/cup-playoffs";
import { cups } from "@fsx/db/schema/cups";
import { championships } from "@fsx/db/schema/championships";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/players-to-tournaments";
import { rankingSnapshots } from "@fsx/db/schema/ranking-snapshots";
import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { tournaments } from "@fsx/db/schema/tournaments";

import { markDataChanged } from "./gamification/computed";
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
        tournamentId: idOf(await caller.tournaments.create({ name: "Etapa Feminina", ratingType: "rapid", date: "2025-03-01", hasPodiums: false })),
        sortOrder: 1,
      }),
    );
    await caller.circuits.results.create({ playerId, circuitPhaseId: stageId, place: 2, points: 8 });
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
    expect(achievements.find((a) => a.family === "dynasty")?.label).toBe("Bicampeão(ã) · Feminino");
    // 3 tournaments, two tier-S wins, a tier-B circuit title and a stage 2nd, 2000 in classic.
    expect(level).toEqual({
      level: 3,
      xp: 45 + 120 + 30 + 30,
      levelXp: 150,
      nextLevelXp: 300,
      breakdown: { tournaments: 45, tournamentPodiums: 120, circuitResults: 20 + 10, ratingThresholds: 30, titles: 0 },
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
    await caller.circuits.results.create({ playerId: ana!, circuitPhaseId, points: 5, category: "Sub 18 Feminino" });
    await caller.circuits.results.create({ playerId: bia!, circuitPhaseId, points: 9, category: "Sub 18 Feminino" });

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
    expect(upcoming.slice(0, 2).map((a) => [a.id, a.description, a.progress])).toEqual([
      ["tournaments-10", "Faltam 7 torneios.", { current: 3, target: 10 }],
      ["rating-rapid-2000", "Faltam 97 pontos acima do seu melhor rating rápido.", { current: 1903, target: 2000 }],
    ]);
    // Phase 8 ladders follow: seasons, tournaments in a year, and single-tournament gain.
    expect(upcoming.map((a) => a.family)).toEqual(expect.arrayContaining(["veteran", "marathon", "leap"]));
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

describe("records.badgeStats", () => {
  test("lists every held emblem with its holders, most held first, within the player total", async () => {
    const before = new Map((await caller.records.badgeStats()).badges.map((badge) => [badge.id, badge.holders]));
    let byId = new Map<string, { holders: number }>();
    const held = (id: string) => (byId.get(id)?.holders ?? 0) - (before.get(id) ?? 0);
    await playerWithResults("Badge Veterano", 10);
    const [champion] = await db.insert(players).values({ name: "Badge Campeão", active: true }).returning({ id: players.id });
    const [championship] = await db.insert(championships).values({ name: "Sergipano Absoluto" }).returning({ id: championships.id });
    const [tournament] = await db
      .insert(tournaments)
      .values({ name: "Sergipano Absoluto 2025", ratingType: "classic", date: "2025-06-01", tier: "S", championshipId: championship!.id })
      .returning({ id: tournaments.id });
    await db.insert(tournamentPodiums).values({ playerId: champion!.id, tournamentId: tournament!.id, place: 1 });
    await markDataChanged(db);

    const { players: total, badges } = await caller.records.badgeStats();
    byId = new Map(badges.map((badge) => [badge.id, badge]));

    expect(total).toBeGreaterThanOrEqual(2);
    expect(byId.get("tournaments-10")).toMatchObject({ label: "10 torneios", tier: "bronze" });
    expect(held("tournaments-10")).toBe(1);
    expect(byId.get("sergipano-absoluto")).toMatchObject({ label: "Campeão(ã) Sergipano · Absoluto", tier: "gold" });
    expect(held("sergipano-absoluto")).toBe(1);
    expect(held("tier-S-1")).toBe(1);
    expect(held("first-podium")).toBe(1);
    expect(badges.every((badge) => badge.holders <= total)).toBe(true);
    const counts = badges.map((badge) => badge.holders);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(new Set(badges.map((badge) => badge.id)).size).toBe(badges.length);
  });

  test("lists emblems nobody holds yet, with zero holders", async () => {
    const { badges } = await caller.records.badgeStats();
    const byId = new Map(badges.map((badge) => [badge.id, badge]));
    expect(byId.get("sergipano-slam")).toMatchObject({ label: "Grand Slam Sergipano", holders: 0 });
    expect(badges.every((badge) => badge.description.length > 0)).toBe(true);
    expect(byId.get("sergipano-slam")?.description).toContain("bullet");
    expect(byId.get("rating-classic-2400")).toMatchObject({ holders: 0 });
    expect(byId.get("category-sub-8-masculino")).toMatchObject({ holders: 0 });
    expect(badges.at(-1)!.holders).toBe(0);
  });

  test("the winner of a Bullet cup's Grand Final holds the Bullet emblem", async () => {
    const [winner, loser] = await db
      .insert(players)
      .values([{ name: "Bullet Campeão", active: true }, { name: "Bullet Vice", active: true }])
      .returning({ id: players.id });
    const [cup] = await db
      .insert(cups)
      .values({ name: "Campeonato Sergipano Bullet 2025", imageUrl: "/x.webp", startDate: "2025-02-01", endDate: "2025-03-01", prizePool: 0, ratingType: "blitz" })
      .returning({ id: cups.id });
    const [bracket] = await db.insert(cupBrackets).values({ cupId: cup!.id, bracketType: "GF" }).returning({ id: cupBrackets.id });
    const [playoff] = await db
      .insert(cupPlayoffs)
      .values({ cupBracketId: bracket!.id, phaseType: "Grande Final", sortOrder: 1 })
      .returning({ id: cupPlayoffs.id });
    await db.insert(cupMatches).values({
      playerOneId: winner!.id,
      playerTwoId: loser!.id,
      winnerId: winner!.id,
      cupPlayoffId: playoff!.id,
      bestOf: 11,
      sortOrder: 1,
      date: "2025-03-01",
    });
    const before = (await caller.records.badgeStats()).badges.find((badge) => badge.id === "sergipano-bullet")?.holders ?? 0;
    await markDataChanged(db);

    const after = (await caller.records.badgeStats()).badges.find((badge) => badge.id === "sergipano-bullet");
    expect(after?.holders).toBe(before + 1);
    const stats = await caller.players.stats({ id: winner!.id });
    expect(stats.achievements.map((achievement) => achievement.id)).toContain("sergipano-bullet");
  });
});
