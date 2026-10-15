import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { sql } from "drizzle-orm";

import { createDb } from "@fsx/db";

import { callerAs, ownerCaller, type AdminCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let admin: AdminCaller;
let visitor: AdminCaller;
let images: R2Bucket;
let dispose: () => Promise<void>;
let db: ReturnType<typeof createDb>;

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array.from({ length: 2000 }, (_, index) => index % 251)]);
const base64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const photo = { mime: "image/jpeg", data: base64(JPEG) } as const;
const consent = { consent: true } as const;

const newPlayer = async (name: string, extra: Record<string, unknown> = {}) =>
  (await admin.players.create({ name, blitz: 1900, rapid: 1900, classic: 1900, sex: "male", ...extra }))[0]!.id;
const pendingKeys = async () => (await images.list({ prefix: "pending/" })).objects.map((object) => object.key);
const requestOf = async (playerId: number) => (await admin.playerRequests.list()).find((row) => row.player.id === playerId)!;

beforeAll(async () => {
  const test = await createTestD1("fsx-request-photos");
  images = test.images;
  testEnv.IMAGES = images;
  db = createDb(test.binding);
  admin = await ownerCaller(appRouter.createCaller, db);
  visitor = callerAs(appRouter.createCaller, db, null);
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  testEnv.IMAGES = {};
  await dispose();
});

describe("a photo sent with an update request", () => {
  test("waits privately under pending/ and a photo alone is a valid request", async () => {
    const playerId = await newPlayer("Com Foto");
    await visitor.playerRequests.submit({ playerId, photo, ...consent });

    const row = await requestOf(playerId);
    expect(row.photoKey).toMatch(/^pending\/[a-f0-9-]+\.jpg$/);
    expect(await pendingKeys()).toContain(row.photoKey!);
    expect((await admin.players.forEdit({ id: playerId })).imageUrl).toBeNull();
    expect((await admin.playerRequests.photo({ id: row.id }))?.dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  test("only an administrator can read it", async () => {
    const playerId = await newPlayer("Foto Privada");
    await visitor.playerRequests.submit({ playerId, photo, ...consent });
    const { id } = await requestOf(playerId);
    await expect(visitor.playerRequests.photo({ id })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("approving moves it to the player's public key and removes the previous photo", async () => {
    const old = await admin.images.upload({ kind: "players", mime: "image/jpeg", data: base64(JPEG) });
    const playerId = await newPlayer("Foto Aprovada", { imageUrl: old.url });
    await visitor.playerRequests.submit({ playerId, birthYear: 2010, photo, ...consent });
    const row = await requestOf(playerId);

    expect(await admin.playerRequests.approve({ id: row.id })).toMatchObject({ photo: "applied" });

    const player = await admin.players.forEdit({ id: playerId });
    expect(player.imageUrl).toMatch(/^\/api\/media\/players\/[a-f0-9-]+\.jpg$/);
    expect(player.imageUrl).not.toBe(old.url);
    expect(await images.head(player.imageUrl!.replace("/api/media/", ""))).not.toBeNull();
    expect(await images.head(old.url.replace("/api/media/", ""))).toBeNull();
    expect(await images.head(row.photoKey!)).toBeNull();
    expect((await requestOf(playerId)).photoKey).toBeNull();
  });

  test("approving without the object still applies the other fields", async () => {
    const playerId = await newPlayer("Foto Expirada");
    await visitor.playerRequests.submit({ playerId, birthYear: 2011, photo, ...consent });
    const row = await requestOf(playerId);
    await images.delete(row.photoKey!);

    expect(await admin.playerRequests.approve({ id: row.id })).toMatchObject({ photo: "missing" });
    expect(await admin.players.forEdit({ id: playerId })).toMatchObject({ birthYear: 2011, imageUrl: null });
  });

  test("rejecting and deleting remove the object", async () => {
    const rejected = await newPlayer("Foto Rejeitada");
    await visitor.playerRequests.submit({ playerId: rejected, photo, ...consent });
    const first = await requestOf(rejected);
    await admin.playerRequests.reject({ id: first.id });
    expect(await images.head(first.photoKey!)).toBeNull();

    const deleted = await newPlayer("Foto Apagada");
    await visitor.playerRequests.submit({ playerId: deleted, photo, ...consent });
    const second = await requestOf(deleted);
    await admin.playerRequests.delete({ id: second.id });
    expect(await images.head(second.photoKey!)).toBeNull();
  });

  test("refuses files that are not images, are too small or too large, and stores nothing", async () => {
    const playerId = await newPlayer("Foto Inválida");
    const before = (await pendingKeys()).length;
    const text = base64(new TextEncoder().encode("não sou imagem".repeat(100)));
    await expect(visitor.playerRequests.submit({ playerId, photo: { mime: "image/jpeg", data: text }, ...consent })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(visitor.playerRequests.submit({ playerId, photo: { mime: "image/jpeg", data: base64(JPEG.slice(0, 100)) }, ...consent })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const big = new Uint8Array(2 * 1024 * 1024 + 10);
    big.set([0xff, 0xd8, 0xff]);
    await expect(visitor.playerRequests.submit({ playerId, photo: { mime: "image/jpeg", data: base64(big) }, ...consent })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(visitor.playerRequests.submit({ playerId, photo: { mime: "image/svg+xml", data: photo.data }, ...consent } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await pendingKeys()).length).toBe(before);
  });

  test("a second photo waits next to the first, and approving one drops the others", async () => {
    const playerId = await newPlayer("Duas Fotos");
    await visitor.playerRequests.submit({ playerId, photo, ...consent });
    const other = { mime: "image/jpeg", data: base64(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array.from({ length: 1500 }, (_, index) => (index * 7) % 251)])) } as const;
    await visitor.playerRequests.submit({ playerId, photo: other, ...consent });

    const rows = (await admin.playerRequests.list()).filter((row) => row.player.id === playerId);
    expect(rows.filter((row) => row.photoKey !== null)).toHaveLength(2);
    const [chosen, rival] = rows;
    expect(await admin.playerRequests.approve({ id: chosen!.id })).toMatchObject({ photo: "applied" });

    expect(await images.head(rival!.photoKey!)).toBeNull();
    const after = (await admin.playerRequests.list()).find((row) => row.id === rival!.id)!;
    expect(after).toMatchObject({ status: "pending", photoKey: null });
  });

  test("merging a player removes the photos waiting for the deleted record", async () => {
    const source = await newPlayer("Duplicada Com Foto");
    const target = await newPlayer("Original");
    await visitor.playerRequests.submit({ playerId: Math.max(source, target), photo, ...consent });
    const [row] = (await admin.playerRequests.list()).filter((request) => request.player.id === Math.max(source, target));
    expect(await images.head(row!.photoKey!)).not.toBeNull();

    await admin.players.merge({ sourceId: source, targetId: target });
    expect(await images.head(row!.photoKey!)).toBeNull();
  });

  test("photos waiting for review are capped overall", async () => {
    const { MAX_PENDING_PHOTOS } = await import("./routers/player-requests");
    const owner = await newPlayer("Dona das Fotos");
    const missing = Math.max(0, MAX_PENDING_PHOTOS - (await pendingKeys()).length);
    await db.run(sql`
      WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${missing})
      INSERT INTO player_update_requests (player_id, status, photo_key)
      SELECT ${owner}, 'pending', 'pending/00000000-0000-0000-0000-' || printf('%012d', i) || '.jpg' FROM n WHERE ${missing} > 0`);
    const another = await newPlayer("Sem Vaga");
    await expect(visitor.playerRequests.submit({ playerId: another, photo, ...consent })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await expect(visitor.playerRequests.submit({ playerId: another, birthYear: 2012, ...consent })).resolves.toEqual({ received: true });
  });
});
