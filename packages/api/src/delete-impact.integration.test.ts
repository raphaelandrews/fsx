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

beforeAll(async () => {
  const d1 = await createTestD1("fsx-delete-impact");
  miniflare = d1.miniflare;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const newPlayer = (name: string, clubId?: number) =>
  caller.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", clubId });

describe("what a delete would affect", () => {
  test("a club names the players that keep it from being deleted", async () => {
    const clubId = idOf(await caller.clubs.create({ name: "Clube Impacto" }));
    await newPlayer("Atleta Um", clubId);
    await newPlayer("Atleta Dois", clubId);

    const impact = await caller.deletion.impact({ entity: "club", id: clubId });
    expect(impact).toMatchObject({ name: "Clube Impacto", alsoDeletes: [] });
    expect(impact.blockedBy).toEqual([expect.objectContaining({ plural: "players", count: 2 })]);

    await expect(caller.clubs.delete({ id: clubId })).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("Club “Clube Impacto” cannot be deleted yet: it is still used by 2 players."),
    });
  });

  test("a club nobody uses has no blockers and can be deleted", async () => {
    const clubId = idOf(await caller.clubs.create({ name: "Clube Livre" }));
    expect(await caller.deletion.impact({ entity: "club", id: clubId })).toMatchObject({ blockedBy: [], alsoDeletes: [] });
    await caller.clubs.delete({ id: clubId });
  });

  test("a title lists the player assignments that would disappear with it", async () => {
    const titleId = idOf(await caller.titles.create({ name: "Título Impacto", shortName: "TI", type: "internal" }));
    const playerA = idOf(await newPlayer("Titular A"));
    const playerB = idOf(await newPlayer("Titular B"));
    await caller.playersToTitles.link({ playerId: playerA, titleId });
    await caller.playersToTitles.link({ playerId: playerB, titleId });

    const impact = await caller.deletion.impact({ entity: "title", id: titleId });
    expect(impact.blockedBy).toEqual([]);
    expect(impact.alsoDeletes).toEqual([expect.objectContaining({ plural: "player titles", count: 2 })]);
  });

  test("a tournament with results says how to unblock it", async () => {
    const tournamentId = idOf(await caller.tournaments.create({ name: "Torneio Impacto", ratingType: "rapid" }));
    const playerId = idOf(await newPlayer("Jogador Torneio"));
    await caller.playersTournament.linkWithRating({ playerId, tournamentId, variation: 10, ratingType: "rapid" });

    await expect(caller.tournaments.delete({ id: tournamentId })).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringMatching(/1 rating result.*Revert them first/),
    });
  });

  test("a circuit counts its stages and points, and a finished one is blocked", async () => {
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Impacto", type: "default", year: 2026, tier: "B" }));
    const tournamentId = idOf(await caller.tournaments.create({ name: "Etapa Impacto", ratingType: "rapid" }));
    const circuitPhaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
    const playerId = idOf(await newPlayer("Pontuador"));
    await caller.circuits.podiums.create({ playerId, circuitPhaseId, points: 10 });

    const impact = await caller.deletion.impact({ entity: "circuit", id: circuitId });
    expect(impact.alsoDeletes.map(({ plural, count }) => [plural, count])).toEqual([
      ["stages", 1],
      ["points results", 1],
    ]);

    await caller.circuits.finish({ id: circuitId, finishedAt: "2026-12-01" });
    await expect(caller.circuits.delete({ id: circuitId })).rejects.toMatchObject({
      message: expect.stringContaining("Reopen the season first."),
    });
  });

  test("an unknown record is NOT_FOUND", async () => {
    await expect(caller.deletion.impact({ entity: "club", id: 987_654 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.clubs.delete({ id: 987_654 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
