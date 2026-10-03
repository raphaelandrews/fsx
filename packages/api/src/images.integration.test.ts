import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let caller: Awaited<ReturnType<typeof ownerCaller>>;
let images: R2Bucket;
let dispose: () => Promise<void>;

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...Array.from({ length: 120 }, () => 0)]);
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="#0a5"/><circle cx="16" cy="16" r="8"/></svg>';

const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const svgData = (source: string) => base64(new TextEncoder().encode(source));
const keyOf = (url: string) => url.replace("/api/media/", "");

// Touching `body` on Miniflare's proxied R2 objects throws a DataCloneError
// under Bun, so read the payload through `arrayBuffer` directly.
async function readText(key: string): Promise<string | null> {
  const object = await images.get(key);
  if (!object) return null;
  const { arrayBuffer } = object as Partial<R2ObjectBody>;
  return new TextDecoder().decode(await arrayBuffer!.call(object));
}

beforeAll(async () => {
  const test = await createTestD1("fsx-images");
  images = test.images;
  testEnv.IMAGES = images;
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  testEnv.IMAGES = {};
  await dispose();
});

describe("images.upload for logos and flags", () => {
  test("stores an SVG with its content type and a derived viewBox", async () => {
    const { url } = await caller.images.upload({ kind: "clubs", mime: "image/svg+xml", data: svgData(LOGO_SVG) });
    expect(url).toMatch(/^\/api\/media\/clubs\/[a-f0-9-]+\.svg$/);

    const head = await images.head(keyOf(url));
    expect(head?.httpMetadata?.contentType).toBe("image/svg+xml");
    expect(await readText(keyOf(url))).toContain('viewBox="0 0 64 32"');
  });

  test("accepts small rasters for flags", async () => {
    const { url } = await caller.images.upload({ kind: "locations", mime: "image/png", data: base64(PNG) });
    expect(url).toMatch(/^\/api\/media\/locations\/[a-f0-9-]+\.png$/);
  });

  test("rejects unsafe SVGs without storing anything", async () => {
    const before = (await images.list({ prefix: "clubs/" })).objects.length;
    await expect(
      caller.images.upload({
        kind: "clubs",
        mime: "image/svg+xml",
        data: svgData('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>'),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "SVG event handlers are not allowed" });
    await expect(
      caller.images.upload({ kind: "clubs", mime: "image/svg+xml", data: svgData(`<html>${"x".repeat(80)}</html>`) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "The file is not an SVG image" });
    expect((await images.list({ prefix: "clubs/" })).objects.length).toBe(before);
  });

  test("enforces each kind's types and size limit", async () => {
    await expect(
      caller.images.upload({ kind: "players", mime: "image/svg+xml", data: svgData(LOGO_SVG) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "This image type is not allowed here" });

    const oversized = new Uint8Array(512 * 1024 + 1);
    oversized.set(PNG.slice(0, 8));
    await expect(
      caller.images.upload({ kind: "clubs", mime: "image/png", data: base64(oversized) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Image is too large (max 512 KB)" });

    await expect(
      caller.images.upload({ kind: "clubs", mime: "image/png", data: svgData(LOGO_SVG) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Image content does not match its type" });
  });
});

describe("club logos and location flags in R2", () => {
  test("only accept uploads of their own kind", async () => {
    const { url: logo } = await caller.images.upload({ kind: "clubs", mime: "image/svg+xml", data: svgData(LOGO_SVG) });
    const { url: flag } = await caller.images.upload({ kind: "locations", mime: "image/svg+xml", data: svgData(LOGO_SVG) });

    await expect(caller.clubs.create({ name: "Clube R2", logoUrl: logo })).resolves.toMatchObject([{ logoUrl: logo }]);
    await expect(caller.clubs.create({ name: "Clube Bandeira", logoUrl: flag })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.locations.create({ name: "Estância", type: "city", flagUrl: flag })).resolves.toMatchObject([{ flagUrl: flag }]);
    await expect(
      caller.locations.create({ name: "Externa", type: "city", flagUrl: "https://example.com/flag.svg" }),
    ).resolves.toHaveLength(1);
  });

  test("deleting the record removes its image, unless a reference blocks the delete", async () => {
    const { url: kept } = await caller.images.upload({ kind: "clubs", mime: "image/svg+xml", data: svgData(LOGO_SVG) });
    const [blocked] = await caller.clubs.create({ name: "Clube com jogador", logoUrl: kept });
    await caller.players.create({ name: "Jogador", blitz: 1500, rapid: 1500, classic: 1500, sex: "male", clubId: blocked!.id });
    await expect(caller.clubs.delete({ id: blocked!.id })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await images.head(keyOf(kept))).not.toBeNull();

    const { url: removed } = await caller.images.upload({ kind: "clubs", mime: "image/svg+xml", data: svgData(LOGO_SVG) });
    const [club] = await caller.clubs.create({ name: "Clube removido", logoUrl: removed });
    await expect(caller.clubs.delete({ id: club!.id })).resolves.toEqual([{ id: club!.id }]);
    expect(await images.head(keyOf(removed))).toBeNull();

    const { url: flag } = await caller.images.upload({ kind: "locations", mime: "image/png", data: base64(PNG) });
    const [location] = await caller.locations.create({ name: "Propriá", type: "city", flagUrl: flag });
    await expect(caller.locations.delete({ id: location!.id })).resolves.toEqual([{ id: location!.id }]);
    expect(await images.head(keyOf(flag))).toBeNull();
  });
});
