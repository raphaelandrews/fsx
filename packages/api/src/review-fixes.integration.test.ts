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
  const test = await createTestD1("fsx-review-fixes");
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

describe("event links stay on the event page", () => {
  test("generic link procedures reject event-owned groups", async () => {
    const event = idOf(await caller.events.create({ name: "Aberto", startDate: "2026-11-01" }));
    const [link] = await caller.events.setLinks({
      eventId: event,
      links: [{ type: "regulation", href: "https://example.com/r" }],
    });
    const events = await caller.events.list();
    const groupId = events.find((item) => item.id === event)!.linkGroup!.id;

    await expect(
      caller.links.createLink({ linkGroupId: groupId, label: "Extra", icon: "link", sortOrder: 1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.links.updateLink({ id: link!.id, label: "Outro" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(caller.links.deleteGroup({ id: groupId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(caller.links.updateGroup({ id: groupId, label: "x" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await caller.events.delete({ id: event });
    await expect(caller.events.delete({ id: event })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await caller.links.list()).some((group) => group.id === groupId)).toBe(false);
  });
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
