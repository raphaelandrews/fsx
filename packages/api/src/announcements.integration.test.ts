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
  const d1 = await createTestD1("fsx-announcements");
  miniflare = d1.miniflare;
  caller = await ownerCaller(appRouter.createCaller, createDb(d1.binding));
});

afterAll(async () => {
  await miniflare.dispose();
});

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const player = async (name: string) =>
  idOf(await caller.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male" }));

describe("announcements linked to a player", () => {
  test("a linked announcement shows its player and appears in the player's list", async () => {
    const playerId = await player("João Conceição");
    const id = idOf(
      await caller.announcements.create({ year: 2026, number: 1, content: "Título de MSE concedido a João Conceição.", playerId }),
    );
    await caller.announcements.create({ year: 2026, number: 2, content: "Calendário 2026." });

    expect((await caller.announcements.byId({ id })).player).toEqual({ id: playerId, name: "João Conceição", nickname: null });
    expect(await caller.announcements.byPlayer({ playerId })).toEqual([
      { id, year: 2026, number: 1, excerpt: "Título de MSE concedido a João Conceição." },
    ]);

    await caller.announcements.update({ id, playerId: null });
    expect(await caller.announcements.byPlayer({ playerId })).toEqual([]);
  });

  test("linking an unknown player is rejected", async () => {
    await expect(
      caller.announcements.create({ year: 2026, number: 3, content: "Sem jogador.", playerId: 999_999 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("suggests players whose full name appears, ignoring accents and case, by whole words", async () => {
    const ana = await player("Ana Beatriz Souza");
    await player("Ana");
    await player("Mariana Beatriz Souzas");
    const suggestions = await caller.announcements.suggestPlayers({
      content: "A FSX parabeniza ANA BEATRIZ SOUZA, campeã sergipana; Ana também…",
    });
    expect(suggestions.map((suggestion) => suggestion.id)).toEqual([ana]);

    const accented = await caller.announcements.suggestPlayers({ content: "Norma para joao conceicao." });
    expect(accented.map((suggestion) => suggestion.name)).toEqual(["João Conceição"]);
  });
});
