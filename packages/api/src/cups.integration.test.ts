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

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const PHOTO = new Uint8Array(2048);
PHOTO.set(PNG_SIGNATURE);
const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const keyOf = (url: string) => url.replace("/api/media/", "");
const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;

beforeAll(async () => {
  const test = await createTestD1("fsx-cups");
  images = test.images;
  testEnv.IMAGES = images;
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  testEnv.IMAGES = {};
  await dispose();
});

describe("cups", () => {
  test("require ISO dates in order", async () => {
    const image = await caller.images.upload({
      kind: "players",
      mime: "image/png",
      data: base64(PHOTO),
    });
    const base = { name: "Copa", imageUrl: image.url, prizePool: 0, ratingType: "blitz" as const };
    await expect(
      caller.cups.create({ ...base, startDate: "amanhã", endDate: "2026-01-02" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      caller.cups.create({ ...base, startDate: "2026-02-01", endDate: "2026-01-02" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    const cup = idOf(
      await caller.cups.create({ ...base, startDate: "2026-01-01", endDate: "2026-01-02" }),
    );
    await caller.cups.delete({ id: cup });
    expect(await images.head(keyOf(image.url))).toBeNull();
  });
});
