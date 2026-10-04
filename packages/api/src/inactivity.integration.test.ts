import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";
import { players } from "@fsx/db/schema/players";

import { yearsBefore } from "./routers/rating-update";
import { createTestD1 } from "./test-d1";
import { ownerCaller, type AdminCaller } from "./test-admin";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let miniflare: Miniflare;
let caller: AdminCaller;
let db: ReturnType<typeof createDb>;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-inactivity");
  miniflare = d1.miniflare;
  db = createDb(d1.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const yearsAgo = (years: number) => yearsBefore(today, years);

// Registered long ago, so only their tournaments decide.
async function veteran(name: string) {
  const id = idOf(await caller.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true }));
  await db.update(players).set({ createdAt: `${yearsAgo(10)} 12:00:00` }).where(eq(players.id, id));
  return id;
}
const tournament = async (name: string, date: string) =>
  idOf(await caller.tournaments.create({ name, ratingType: "rapid", date }));
const activeOf = async (ids: number[]) =>
  Object.fromEntries(
    (await db.select({ id: players.id, active: players.active }).from(players).where(inArray(players.id, ids))).map(
      (row) => [row.id, row.active],
    ),
  );

describe("yearsBefore", () => {
  test("subtracts years and moves 29 February to the 28th", () => {
    expect(yearsBefore("2026-10-03", 3)).toBe("2023-10-03");
    expect(yearsBefore("2028-02-29", 3)).toBe("2025-02-28");
  });
});

describe("automatic inactivity", () => {
  test("a ranking update deactivates players without activity in 3 years, and playing again reactivates them", async () => {
    const stale = await veteran("Sem Torneio Recente");
    await caller.playersTournament.linkWithRating({ playerId: stale, tournamentId: await tournament("Aberto Antigo", yearsAgo(4)), variation: 5, ratingType: "rapid" });

    const recent = await veteran("Jogou Há Dois Anos");
    await caller.playersTournament.linkWithRating({ playerId: recent, tournamentId: await tournament("Aberto Recente", yearsAgo(2)), variation: 5, ratingType: "rapid" });

    const podiumOnly = await veteran("Só Pódio");
    await caller.tournamentPodiums.create({ playerId: podiumOnly, tournamentId: await tournament("Sergipano Recente", yearsAgo(1)), place: 2 });

    const schoolKid = await veteran("Só Circuito");
    const circuitId = idOf(await caller.circuits.create({ name: "Circuito Escolar Teste", type: "school", year: Number(today.slice(0, 4)) }));
    const phaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId: await tournament("Etapa Escolar", yearsAgo(1)), sortOrder: 1 }));
    await caller.circuits.podiums.create({ playerId: schoolKid, circuitPhaseId: phaseId, points: 3, category: "Sub 10 Masculino" });

    const newcomer = idOf(await caller.players.create({ name: "Recém Filiado", blitz: 1900, rapid: 1900, classic: 1900, sex: "female", active: true }));
    const neverPlayed = await veteran("Nunca Jogou");

    const { deactivated } = await caller.playersTournament.snapshotRankings({ ratingTypes: ["rapid"] });
    expect(deactivated).toBe(2);
    expect(await activeOf([stale, recent, podiumOnly, schoolKid, newcomer, neverPlayed])).toEqual({
      [stale]: false,
      [recent]: true,
      [podiumOnly]: true,
      [schoolKid]: true,
      [newcomer]: true,
      [neverPlayed]: false,
    });
    const ranked = (await caller.players.ranking({ id: recent })).rapid;
    expect(ranked?.players).toBe(4);

    await caller.playersTournament.linkWithRating({ playerId: stale, tournamentId: await tournament("Aberto de Volta", today), variation: 3, ratingType: "rapid" });
    expect((await activeOf([stale]))[stale]).toBe(true);
    expect((await caller.playersTournament.snapshotRankings({ ratingTypes: ["rapid"] })).deactivated).toBe(0);
  });
});

describe("youth titles", () => {
  test("are removed from 1 January of the year the holder turns the title's age", async () => {
    const year = Number(today.slice(0, 4));
    const mms = idOf(await caller.titles.create({ name: "Mestre Mirim Sergipano", shortName: "MMS", type: "internal", tier: 1, losesAtAge: 15 }));
    const mjs = idOf(await caller.titles.create({ name: "Mestre Júnior Sergipano", shortName: "MJS", type: "internal", tier: 1, losesAtAge: 19 }));
    const mse = idOf(await caller.titles.create({ name: "Mestre Sergipano", shortName: "MSE", type: "internal", tier: 3 }));

    const holder = async (name: string, birthDate: string | undefined, titleId: number) => {
      const id = idOf(await caller.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", active: true, birthDate }));
      await caller.playersToTitles.link({ playerId: id, titleId });
      return id;
    };
    const turns15ThisYear = await holder("Mirim 15", `${year - 15}-12-31`, mms);
    const turns14ThisYear = await holder("Mirim 14", `${year - 14}-01-01`, mms);
    const turns19ThisYear = await holder("Júnior 19", `${year - 19}-06-15`, mjs);
    const turns18ThisYear = await holder("Júnior 18", `${year - 18}-06-15`, mjs);
    const noBirthDate = await holder("Mirim Sem Data", undefined, mms);
    const adult = await holder("Mestre Adulto", `${year - 40}-01-01`, mse);

    const result = await caller.playersTournament.snapshotRankings({ ratingTypes: ["rapid"] });
    expect(result).toMatchObject({ titlesRemoved: 2, youthTitlesWithoutBirthDate: 1 });

    const titlesOf = async (playerId: number) =>
      (await caller.playersToTitles.listByPlayer({ playerId })).map((link) => link.title.shortName);
    expect(await titlesOf(turns15ThisYear)).toEqual([]);
    expect(await titlesOf(turns14ThisYear)).toEqual(["MMS"]);
    expect(await titlesOf(turns19ThisYear)).toEqual([]);
    expect(await titlesOf(turns18ThisYear)).toEqual(["MJS"]);
    expect(await titlesOf(noBirthDate)).toEqual(["MMS"]);
    expect(await titlesOf(adult)).toEqual(["MSE"]);
  });
});
