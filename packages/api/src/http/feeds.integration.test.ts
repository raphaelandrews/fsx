import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { createTestD1 } from "../test-d1";
import { ownerCaller } from "../test-admin";
import { mockWorkerEnv } from "../test-env";

mockWorkerEnv();

const { appRouter } = await import("../routers/index");
const { getFeedRows } = await import("./feeds");

let dispose: () => Promise<void>;
let db: ReturnType<typeof createDb>;
let caller: Awaited<ReturnType<typeof ownerCaller>>;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-feeds");
  db = createDb(d1.binding);
  caller = await ownerCaller(appRouter.createCaller, db);
  await caller.posts.create({ title: "Publicada", slug: "publicada", content: "Texto da **notícia**.", published: true });
  await caller.posts.create({ title: "Rascunho", slug: "rascunho", content: "Ainda não.", published: false });
  await caller.announcements.create({ year: 2026, number: 7, content: "Aviso oficial aos clubes." });
  dispose = () => d1.miniflare.dispose();
});

afterAll(async () => {
  await dispose();
});

describe("feed rows", () => {
  test("list published news and announcements, never drafts", async () => {
    const rows = await getFeedRows(db);
    expect(rows.map((row) => row.title).sort()).toEqual(["Comunicado 007/2026", "Publicada"]);
    expect(rows.find((row) => row.kind === "post")).toMatchObject({ path: "/noticias/publicada" });
    expect(rows.find((row) => row.kind === "announcement")).toMatchObject({ path: expect.stringMatching(/^\/comunicados\/\d+$/) });
  });

  test("send only a teaser of long content", async () => {
    await caller.posts.create({ title: "Longa", slug: "longa", content: "x".repeat(50_000), published: true });
    const long = (await getFeedRows(db)).find((row) => row.title === "Longa");
    expect(long!.teaser.length).toBe(1_200);
  });
});
