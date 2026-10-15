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

const PNG = new Uint8Array([
  137,
  80,
  78,
  71,
  13,
  10,
  26,
  10,
  ...Array.from({ length: 120 }, () => 0),
]);
const PHOTO = new Uint8Array(2048);
PHOTO.set(PNG.slice(0, 8));
const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const keyOf = (url: string) => url.replace("/api/media/", "");
const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;
const upload = async (kind: "clubs" | "locations") =>
  (await caller.images.upload({ kind, mime: "image/png", data: base64(PNG) })).url;

beforeAll(async () => {
  const test = await createTestD1("fsx-media-cleanup");
  images = test.images;
  testEnv.IMAGES = images;
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  testEnv.IMAGES = {};
  await dispose();
});

describe("replaced images are removed server-side", () => {
  test("club logo", async () => {
    const first = await upload("clubs");
    const club = idOf(await caller.clubs.create({ name: "Clube Imagem", logoUrl: first }));
    const second = await upload("clubs");

    await caller.clubs.update({ id: club, name: "Clube Imagem", logoUrl: second });
    expect(await images.head(keyOf(first))).toBeNull();
    expect(await images.head(keyOf(second))).not.toBeNull();

    await caller.clubs.update({ id: club, name: "Clube Renomeado" });
    expect(await images.head(keyOf(second))).not.toBeNull();

    await caller.clubs.delete({ id: club });
    expect(await images.head(keyOf(second))).toBeNull();
  });

  test("post cover is removed on delete", async () => {
    const { url } = await caller.images.upload({
      kind: "posts",
      mime: "image/png",
      data: base64(PHOTO),
    });
    const post = idOf(
      await caller.posts.create({
        title: "Capa",
        slug: "capa",
        content: "x",
        published: false,
        imageUrl: url,
      }),
    );
    await caller.posts.delete({ id: post });
    expect(await images.head(keyOf(url))).toBeNull();
  });
});
