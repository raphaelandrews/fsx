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
  const d1 = await createTestD1("fsx-clubs");
  miniflare = d1.miniflare;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const member = async (clubId: number, name: string, rapid: number, active = true) =>
  idOf(await caller.players.create({ name, blitz: 1900, rapid, classic: 1900, sex: "male", active, clubId }));

describe("club standings", () => {
  test("strength averages the top 10 active members with empty slots counted as a newcomer; clubs under 3 are unranked; equal strengths share a rank", async () => {
    const forte = idOf(await caller.clubs.create({ name: "Clube Forte" }));
    const empate = idOf(await caller.clubs.create({ name: "Clube Empate" }));
    const pequeno = idOf(await caller.clubs.create({ name: "Clube Pequeno" }));
    const dupla = idOf(await caller.clubs.create({ name: "Clube Dupla" }));
    await caller.clubs.create({ name: "Clube Vazio" });

    for (const [i, rapid] of [2100, 2000, 1990, 1980, 1970, 1960].entries()) await member(forte, `Forte ${i}`, rapid);
    const veteran = await member(forte, "Forte Inativo", 2500, false);
    for (const i of [1, 2, 3, 4, 5]) await member(empate, `Empate ${i}`, 2008);
    for (const i of [1, 2, 3]) await member(pequeno, `Pequeno ${i}`, 2300);
    for (const i of [1, 2]) await member(dupla, `Dupla ${i}`, 2500);

    const tournamentId = idOf(await caller.tournaments.create({ name: "Sergipano 1990", ratingType: "classic" }));
    await caller.tournamentPodiums.create({ playerId: veteran, tournamentId, place: 1 });
    await caller.tournamentPodiums.create({ playerId: veteran, tournamentId, place: 2, category: "Juvenil" });

    const standings = await caller.clubs.leaderboard();
    expect(standings.map((s) => s.club.name)).toEqual(["Clube Dupla", "Clube Empate", "Clube Forte", "Clube Pequeno"]);
    const byName = Object.fromEntries(standings.map((s) => [s.club.name, s]));
    expect(byName["Clube Forte"]).toMatchObject({
      members: 7,
      activeMembers: 6,
      strength: { rapid: 1960, classic: 1900 },
      rank: { rapid: 2 },
      medals: { gold: 1, silver: 1, bronze: 0 },
    });
    // 6 players: (2100+2000+1990+1980+1970+1960 + 4 × 1900) / 10. 5 × 2008 + 5 × 1900 → 1954.
    expect(byName["Clube Empate"]).toMatchObject({ strength: { rapid: 1954 }, rank: { rapid: 3 } });
    // 3 players is enough to rank, but the 7 empty slots pull the average toward the starting rating.
    expect(byName["Clube Pequeno"]).toMatchObject({ activeMembers: 3, strength: { rapid: 2020 }, rank: { rapid: 1 } });
    expect(byName["Clube Dupla"]).toMatchObject({ activeMembers: 2, strength: { rapid: null }, rank: { rapid: null } });
  });

  test("a club page lists members active first and its standing", async () => {
    const club = (await caller.clubs.leaderboard()).find((s) => s.club.name === "Clube Forte")!;
    const page = await caller.clubs.byId({ id: club.club.id });
    expect(page.standing?.rank.rapid).toBe(2);
    expect(page.members[0]).toMatchObject({ name: "Forte 0", active: true });
    expect(page.members.at(-1)).toMatchObject({ name: "Forte Inativo", active: false });
    await expect(caller.clubs.byId({ id: 999_999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("clubs.standing", () => {
  test("returns one club's standing, or null for a club without members or that does not exist", async () => {
    const created = await caller.clubs.create({ name: "Clube Posição" });
    expect(await caller.clubs.standing({ id: created[0]!.id })).toBeNull();
    await member(created[0]!.id, "Sócio da Posição", 1800);
    const standing = await caller.clubs.standing({ id: created[0]!.id });
    expect(standing).toMatchObject({ club: { id: created[0]!.id, name: "Clube Posição" }, members: 1 });
    expect(await caller.clubs.standing({ id: 999_999 })).toBeNull();
  });
});
