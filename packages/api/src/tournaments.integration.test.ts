import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let caller: Awaited<ReturnType<typeof ownerCaller>>;
let dispose: () => Promise<void>;

const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;

beforeAll(async () => {
  const test = await createTestD1("fsx-tournaments");
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  await dispose();
});

describe("deleting a tournament with podiums", () => {
  test("is refused", async () => {
    const tournament = idOf(
      await caller.tournaments.create({ name: "Com Pódio", ratingType: "rapid" }),
    );
    const player = idOf(
      await caller.players.create({
        name: "Podium Player",
        blitz: 1000,
        rapid: 1000,
        classic: 1000,
        sex: "male",
        active: true,
        verified: false,
      }),
    );
    await caller.tournamentPodiums.create({ playerId: player, tournamentId: tournament, place: 1 });
    await expect(caller.tournaments.delete({ id: tournament })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe("searching tournaments and clubs by name", () => {
  test("ignores accents and case on both sides", async () => {
    const tournament = idOf(await caller.tournaments.create({ name: "Copa São Paulo de Xadrez", ratingType: "rapid" }));
    const club = idOf(await caller.clubs.create({ name: "Clube Ação Rápida" }));

    expect((await caller.tournaments.search({ query: "sao paulo" })).map((row) => row.id)).toEqual([tournament]);
    expect((await caller.tournaments.search({ query: "SÃO xadrez" })).map((row) => row.id)).toEqual([tournament]);
    expect((await caller.clubs.search({ query: "acao rapida" })).map((row) => row.id)).toEqual([club]);
    expect((await caller.clubs.search({ query: "ação" })).map((row) => row.id)).toEqual([club]);
    expect(await caller.tournaments.search({ query: "inexistente" })).toEqual([]);
  });
});

describe("the public tournament archive", () => {
  const winnerOf = (rows: { winners: { name: string }[] }) => rows.winners.map((winner) => winner.name);

  async function tournament(name: string, extra: Record<string, unknown> = {}) {
    return idOf(await caller.tournaments.create({ name, ratingType: "rapid", ...extra } as never));
  }
  const player = async (name: string) =>
    idOf(await caller.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true, verified: false }));

  test("lists newest first, filters by year, tier, rhythm and championship, and names the winners", async () => {
    const championshipId = idOf(await caller.champions.create({ name: "Campeonato Arquivo" }));
    const ana = await player("Ana Arquivo");
    const bia = await player("Bia Arquivo");
    const old = await tournament("Arquivo 2031 Aberto", { date: "2031-03-10", tier: "A", championshipId });
    const recent = await tournament("Arquivo 2032 Equipes", { date: "2032-05-20", tier: "S", ratingType: "blitz", championshipId });
    await tournament("Arquivo 2032 Sem Data Final", { date: "2032-02-01", tier: "B" });
    await caller.tournamentPodiums.create({ playerId: ana, tournamentId: recent, place: 1 });
    await caller.tournamentPodiums.create({ playerId: bia, tournamentId: recent, place: 1 });
    await caller.tournamentPodiums.create({ playerId: ana, tournamentId: recent, place: 1, category: "Sub 18 Masculino" });

    const all = await caller.tournaments.page({ page: 1 });
    expect(all.years).toEqual(expect.arrayContaining([2032, 2031]));
    expect(all.years).toEqual([...all.years].sort((a, b) => b - a));
    expect(all.pagination).toMatchObject({ currentPage: 1, itemsPerPage: 12 });
    const names = all.tournaments.map((row) => row.name);
    expect(names.indexOf("Arquivo 2032 Equipes")).toBeLessThan(names.indexOf("Arquivo 2031 Aberto"));
    expect(winnerOf(all.tournaments.find((row) => row.id === recent)!)).toEqual(["Ana Arquivo", "Bia Arquivo"]);
    expect(all.tournaments.find((row) => row.id === old)).toMatchObject({ winners: [], championship: { name: "Campeonato Arquivo" } });

    const ids = async (filters: object) => (await caller.tournaments.page({ page: 1, ...filters })).tournaments.map((row) => row.id);
    expect(await ids({ year: 2031 })).toEqual([old]);
    expect(await ids({ year: 2032, tier: "S" })).toEqual([recent]);
    expect(await ids({ ratingType: "blitz", year: 2032 })).toEqual([recent]);
    expect((await ids({ championshipId })).sort()).toEqual([old, recent].sort());
    expect(await ids({ year: 2099 })).toEqual([]);
  });

  test("paginates", async () => {
    for (let index = 0; index < 13; index++) await tournament(`Paginação ${String(index).padStart(2, "0")}`, { date: "2040-01-01" });
    const first = await caller.tournaments.page({ page: 1, year: 2040 });
    const second = await caller.tournaments.page({ page: 2, year: 2040 });
    expect(first.tournaments).toHaveLength(12);
    expect(second.tournaments).toHaveLength(1);
    expect(first.pagination).toMatchObject({ totalItems: 13, totalPages: 2, hasNextPage: true });
  });

  test("shows every player's rating change, best gain first, and the circuits it belongs to", async () => {
    const id = await tournament("Resultados Públicos");
    const gains = await player("Ganhou");
    const loses = await player("Perdeu");
    await caller.playersTournament.linkWithRating({ playerId: loses, tournamentId: id, variation: -7, ratingType: "rapid" });
    await caller.playersTournament.linkWithRating({ playerId: gains, tournamentId: id, variation: 12, ratingType: "rapid" });

    expect(await caller.tournaments.results({ id })).toMatchObject([
      { name: "Ganhou", oldRating: 1900, variation: 12 },
      { name: "Perdeu", oldRating: 1900, variation: -7 },
    ]);

    const circuitId = idOf(await caller.circuits.create({ name: "Circuito do Arquivo", type: "default", year: 2033, tier: "B" }));
    await caller.circuits.phases.create({ circuitId, tournamentId: id, sortOrder: 1 });
    expect((await caller.tournaments.byId({ id })).circuits).toEqual([{ id: circuitId, name: "Circuito do Arquivo", year: 2033 }]);
  });

  test("answers NOT_FOUND for an unknown tournament and rejects malformed filters", async () => {
    await expect(caller.tournaments.results({ id: 987_654 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.tournaments.byId({ id: 987_654 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.tournaments.page({ page: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.tournaments.page({ page: 1, tier: "Z" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
