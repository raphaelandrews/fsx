import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import type { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";
import { playerUpdateRequests } from "@fsx/db/schema/player-update-requests";

import { callerAs, ownerCaller, type AdminCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");
const { MAX_PENDING_PER_PLAYER } = await import("./routers/player-requests");

let miniflare: Miniflare;
let admin: AdminCaller;
let visitor: AdminCaller;
let clubId: number;
let db: ReturnType<typeof createDb>;

const idOf = (rows: { id: number }[]) => rows[0]!.id;
const newPlayer = (name: string, extra: Record<string, unknown> = {}) =>
  admin.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", ...extra });
const consent = { consent: true } as const;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-player-requests");
  miniflare = d1.miniflare;
  db = createDb(d1.binding);
  admin = await ownerCaller(appRouter.createCaller, db);
  visitor = callerAs(appRouter.createCaller, db, null);
  clubId = idOf(await admin.clubs.create({ name: "Clube Solicitação" }));
});

afterAll(async () => {
  await miniflare.dispose();
});

describe("submitting a request without signing in", () => {
  test("stores a proposal and changes nothing on the player", async () => {
    const playerId = idOf(await newPlayer("Enviadora Um"));
    await expect(
      visitor.playerRequests.submit({ playerId, birthYear: 2011, cbxId: 4242, ...consent }),
    ).resolves.toEqual({ received: true });

    expect(await admin.players.forEdit({ id: playerId })).toMatchObject({ birthYear: null, cbxId: null, verified: false });
    const [row] = await admin.playerRequests.list({ status: "pending" });
    expect(row).toMatchObject({ status: "pending", birthYear: 2011, cbxId: 4242, player: { id: playerId } });
  });

  test("needs consent, at least one change, and an empty honeypot", async () => {
    const playerId = idOf(await newPlayer("Enviadora Dois"));
    await expect(visitor.playerRequests.submit({ playerId, cbxId: 1 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(visitor.playerRequests.submit({ playerId, ...consent })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(visitor.playerRequests.submit({ playerId, birthYear: 2012, website: "http://spam", ...consent })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(visitor.playerRequests.submit({ playerId, birthYear: 2999, ...consent })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("answers NOT_FOUND for an unknown player and bounds open requests per player", async () => {
    await expect(visitor.playerRequests.submit({ playerId: 987_654, birthYear: 2012, ...consent })).rejects.toMatchObject({ code: "NOT_FOUND" });

    const playerId = idOf(await newPlayer("Insistente"));
    for (let attempt = 0; attempt < MAX_PENDING_PER_PLAYER; attempt++) {
      await visitor.playerRequests.submit({ playerId, fideId: 100 + attempt, ...consent });
    }
    await expect(visitor.playerRequests.submit({ playerId, fideId: 999, ...consent })).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("Aguarde"),
    });
  });

  test("keeps the review tools admin-only", async () => {
    for (const call of [
      () => visitor.playerRequests.list(),
      () => visitor.playerRequests.byId({ id: 1 }),
      () => visitor.playerRequests.approve({ id: 1 }),
      () => visitor.playerRequests.reject({ id: 1 }),
      () => visitor.playerRequests.delete({ id: 1 }),
    ]) {
      await expect(call()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
  });
});

describe("reviewing a request", () => {
  async function submit(playerId: number, fields: Record<string, unknown>) {
    await visitor.playerRequests.submit({ playerId, ...fields, ...consent } as never);
    const rows = await admin.playerRequests.list({ status: "pending" });
    return rows.find((row) => row.player.id === playerId)!.id;
  }

  test("approving applies only the proposed fields and verifies the player", async () => {
    const playerId = idOf(await newPlayer("Aprovada", { nickname: "Antigo", fideId: 555 }));
    const id = await submit(playerId, { birthYear: 2010, clubId, cbxId: 7001 });

    const detail = await admin.playerRequests.byId({ id });
    expect(detail).toMatchObject({ club: { name: "Clube Solicitação" }, player: { name: "Aprovada", cbxId: null } });

    await admin.playerRequests.approve({ id });
    expect(await admin.players.forEdit({ id: playerId })).toMatchObject({
      birthYear: 2010,
      clubId,
      cbxId: 7001,
      nickname: "Antigo",
      fideId: 555,
      verified: true,
    });
    expect(await admin.playerRequests.byId({ id })).toMatchObject({ status: "approved" });
    await expect(admin.playerRequests.approve({ id })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("an ID already used by someone else fails clearly and leaves the request pending", async () => {
    await newPlayer("Dona do Número", { cbxId: 8001 });
    const playerId = idOf(await newPlayer("Quer o Mesmo"));
    const id = await submit(playerId, { cbxId: 8001, birthYear: 2012 });

    await expect(admin.playerRequests.approve({ id })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "A player with this cbx id already exists.",
    });
    expect(await admin.playerRequests.byId({ id })).toMatchObject({ status: "pending" });
    expect(await admin.players.forEdit({ id: playerId })).toMatchObject({ birthYear: null, verified: false });
  });

  test("rejecting records the note and does not touch the player", async () => {
    const playerId = idOf(await newPlayer("Recusada"));
    const id = await submit(playerId, { birthYear: 2013 });

    await admin.playerRequests.reject({ id, reviewNote: "  Dados não conferem  " });
    expect(await admin.playerRequests.byId({ id })).toMatchObject({ status: "rejected", reviewNote: "Dados não conferem" });
    expect(await admin.players.forEdit({ id: playerId })).toMatchObject({ birthYear: null, verified: false });
    await expect(admin.playerRequests.reject({ id })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(admin.playerRequests.reject({ id: 987_654 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("the dashboard counts what is waiting, and decided requests can be deleted", async () => {
    const before = (await admin.stats.counts()).pendingRequests;
    const playerId = idOf(await newPlayer("Contada"));
    const id = await submit(playerId, { fideId: 31337 });
    expect((await admin.stats.counts()).pendingRequests).toBe(before + 1);

    await admin.playerRequests.reject({ id });
    expect((await admin.stats.counts()).pendingRequests).toBe(before);
    await admin.playerRequests.delete({ id });
    await expect(admin.playerRequests.byId({ id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("retention", () => {
  test("clears decided requests older than the cutoff and never pending ones", async () => {
    const playerId = idOf(await newPlayer("Retida"));
    const oldPlayer = idOf(await newPlayer("Retida Antiga"));
    const stillOpen = idOf(await newPlayer("Retida Aberta"));
    await db.insert(playerUpdateRequests).values([
      { playerId: oldPlayer, status: "approved", fideId: 1, reviewedAt: "2020-01-01 00:00:00" },
      { playerId: oldPlayer, status: "rejected", fideId: 2, reviewedAt: "2020-01-02 00:00:00" },
      { playerId: stillOpen, status: "pending", fideId: 3, createdAt: "2020-01-03 00:00:00" },
    ]);
    await visitor.playerRequests.submit({ playerId, birthYear: 2012, ...consent });
    const [recent] = await admin.playerRequests.list({ status: "pending" }).then((rows) => rows.filter((row) => row.player.id === playerId));
    await admin.playerRequests.reject({ id: recent!.id });

    expect(await admin.playerRequests.deleteReviewed()).toEqual({ deleted: 2 });
    const left = await admin.playerRequests.list();
    expect(left.some((row) => row.player.id === oldPlayer)).toBe(false);
    expect(left.filter((row) => row.player.id === playerId)).toHaveLength(1);
    expect(left.filter((row) => row.player.id === stillOpen)).toHaveLength(1);
  });
});

describe("the optional Turnstile challenge", () => {
  const original = globalThis.fetch;
  afterEach(() => {
    delete (testEnv as Record<string, unknown>).TURNSTILE_SECRET_KEY;
    globalThis.fetch = original;
  });
  const switchOn = (verdict: boolean | "error") => {
    (testEnv as Record<string, unknown>).TURNSTILE_SECRET_KEY = "secret";
    const calls: string[] = [];
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      calls.push(String(init?.body));
      if (verdict === "error") throw new Error("network");
      return Response.json({ success: verdict });
    }) as unknown as typeof fetch;
    return calls;
  };

  test("is skipped when no secret key is configured", async () => {
    const playerId = idOf(await newPlayer("Sem Desafio"));
    await expect(visitor.playerRequests.submit({ playerId, birthYear: 2012, ...consent })).resolves.toEqual({ received: true });
  });

  test("needs a token that Cloudflare confirms once it is configured", async () => {
    const calls = switchOn(true);
    const playerId = idOf(await newPlayer("Com Desafio"));
    const refused = { code: "BAD_REQUEST", message: expect.stringContaining("robô") };

    await expect(visitor.playerRequests.submit({ playerId, birthYear: 2012, ...consent })).rejects.toMatchObject(refused);
    expect(calls).toHaveLength(0);

    await expect(visitor.playerRequests.submit({ playerId, birthYear: 2012, turnstileToken: "token-1", ...consent })).resolves.toEqual({
      received: true,
    });
    expect(calls[0]).toContain("secret=secret");
    expect(calls[0]).toContain("response=token-1");
  });

  test("a rejected token or an unreachable verifier both refuse the request", async () => {
    const playerId = idOf(await newPlayer("Desafio Falho"));
    switchOn(false);
    await expect(visitor.playerRequests.submit({ playerId, birthYear: 2012, turnstileToken: "bad", ...consent })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    switchOn("error");
    await expect(visitor.playerRequests.submit({ playerId, birthYear: 2012, turnstileToken: "any", ...consent })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
