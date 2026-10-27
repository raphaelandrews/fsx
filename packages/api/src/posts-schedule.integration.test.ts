import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { eq } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { posts } from "@fsx/db/schema/posts";

import { callerAs, ownerCaller, type AdminCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");
const { getSitemapEntries } = await import("./http/sitemap");
const { getFeedRows } = await import("./http/feeds");

let admin: AdminCaller;
let visitor: AdminCaller;
let db: ReturnType<typeof createDb>;
let dispose: () => Promise<void>;

const HOUR = 3_600_000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();
const post = (slug: string, extra: Record<string, unknown> = {}) =>
  admin.posts.create({ title: slug, slug, content: "Conteúdo", published: true, ...extra });

beforeAll(async () => {
  const test = await createTestD1("fsx-posts-schedule");
  db = createDb(test.binding);
  admin = await ownerCaller(appRouter.createCaller, db);
  visitor = callerAs(appRouter.createCaller, db, null);
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  await dispose();
});

describe("scheduled posts", () => {
  test("stay out of every public read until their time, then appear without a job", async () => {
    await post("ja-no-ar");
    await post("agendado", { publishAt: inHours(2) });
    await post("rascunho", { published: false });

    expect((await visitor.posts.fresh()).map((p) => p.slug)).toEqual(["ja-no-ar"]);
    expect((await visitor.posts.list()).map((p) => p.slug)).toEqual(["ja-no-ar"]);
    expect((await visitor.posts.byPage({ page: 1 })).posts.map((p) => p.slug)).toEqual(["ja-no-ar"]);
    await expect(visitor.posts.bySlug({ slug: "agendado" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getSitemapEntries(db)).posts.map((p) => p.slug)).toEqual(["ja-no-ar"]);
    expect((await getFeedRows(db)).map((row) => row.path)).toEqual(["/noticias/ja-no-ar"]);

    const scheduled = (await admin.posts.listAdmin()).find((p) => p.slug === "agendado")!;
    await admin.posts.update({ id: scheduled.id, publishAt: new Date(Date.now() - 1000).toISOString() });
    expect((await visitor.posts.fresh()).map((p) => p.slug).sort()).toEqual(["agendado", "ja-no-ar"]);
    expect((await visitor.posts.bySlug({ slug: "agendado" })).slug).toBe("agendado");
  });

  test("the schedule is the publication date, and clearing it publishes now", async () => {
    const [created] = await post("data-agendada", { publishAt: inHours(48) });
    const stored = await admin.posts.forEdit({ id: created!.id });
    expect(stored.publishAt).toBe(stored.createdAt);

    await admin.posts.update({ id: created!.id, publishAt: null });
    const cleared = await admin.posts.forEdit({ id: created!.id });
    expect(cleared.publishAt).toBeNull();
    expect(cleared.createdAt < new Date(Date.now() + HOUR).toISOString().replace("T", " ")).toBe(true);
    expect((await visitor.posts.bySlug({ slug: "data-agendada" })).slug).toBe("data-agendada");
  });

  test("rejects a schedule that is not an instant", async () => {
    await expect(post("invalido", { publishAt: "amanhã" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("post slugs and publication date", () => {
  test("a slug must survive a URL path segment", async () => {
    for (const slug of ["com espaco", "a/b", "q?x", "h#x"]) {
      await expect(post(slug)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    await expect(post("acentuação-ok_1")).resolves.toHaveLength(1);
  });

  test("a draft published later is dated when it goes live", async () => {
    const [draft] = await post("rascunho-antigo", { published: false });
    await db.update(posts).set({ createdAt: "2020-01-01 10:00:00" }).where(eq(posts.id, draft!.id));
    await admin.posts.update({ id: draft!.id, published: true });
    const [after] = await db.select({ createdAt: posts.createdAt }).from(posts).where(eq(posts.id, draft!.id));
    expect(after!.createdAt > "2020-01-02").toBe(true);
  });
});
