import { describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";
import { account, user } from "@fsx/db/schema/auth";

import type { Context } from "./context";
import { DEFAULT_LINK_ICON } from "./link-icons";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, TEST_OWNER_GITHUB_ID } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

const MEDIA_PATH = "/api/media/players/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0.webp";

function callerAs(db: Context["db"], sessionUser: { id: string; name: string }) {
  const ctx = {
    db,
    session: { user: sessionUser },
    requestId: "test-request",
  } as unknown as Context;
  return appRouter.createCaller(ctx);
}

async function insertGithubUser(db: Context["db"], id: string, name: string, githubId: string) {
  await db.insert(user).values({ id, name, email: `${id}@example.com` });
  await db.insert(account).values({
    id: `${id}-github`,
    accountId: githubId,
    providerId: "github",
    userId: id,
  });
}

async function adminCaller(db: Context["db"]) {
  await insertGithubUser(db, "owner-id", "owner", TEST_OWNER_GITHUB_ID);
  return callerAs(db, { id: "owner-id", name: "owner" });
}

describe("admin create/update round-trips", () => {
  test("persists player renames and media paths, and rejects unsafe URLs, icons, and blank names", async () => {
    const { miniflare, binding } = await createTestD1("fsx-admin-mutations");

    try {
      const caller = await adminCaller(createDb(binding));

      const [created] = await caller.players.create({
        name: "Joao Silva",
        blitz: 1500,
        rapid: 1500,
        classic: 1500,
        sex: "male",
        imageUrl: MEDIA_PATH,
      });
      if (!created) throw new Error("Player insert failed");

      await caller.players.update({ id: created.id, name: "João Souza", imageUrl: MEDIA_PATH });
      expect(await caller.players.forEdit({ id: created.id })).toMatchObject({
        name: "João Souza",
        imageUrl: MEDIA_PATH,
      });
      expect(await caller.players.search({ query: "souza" })).toEqual([
        { id: created.id, name: "João Souza" },
      ]);

      await caller.players.update({ id: created.id, imageUrl: "https://example.com/photo.jpg" });
      await expect(
        caller.players.update({ id: created.id, imageUrl: "/api/media/../secret.webp" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const [post] = await caller.posts.create({
        title: "Notícia",
        slug: "noticia",
        content: "Conteúdo",
        published: true,
        imageUrl: MEDIA_PATH.replace("players", "posts"),
      });
      expect(post?.imageUrl).toBe(MEDIA_PATH.replace("players", "posts"));

      await expect(
        caller.clubs.create({ name: "Clube", logoUrl: "javascript:alert(1)" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        caller.clubs.create({ name: "Clube", logoUrl: MEDIA_PATH }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        caller.clubs.create({ name: "Clube", logoUrl: "https://example.com/logo.png" }),
      ).resolves.toHaveLength(1);

      if (!post) throw new Error("Post insert failed");
      await expect(caller.posts.update({ id: post.id, title: "  " })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      await expect(caller.posts.update({ id: post.id, slug: "" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });

      const [tournament] = await caller.tournaments.create({ name: "Torneio", ratingType: "rapid" });
      if (!tournament) throw new Error("Tournament insert failed");
      await expect(
        caller.tournaments.update({ id: tournament.id, name: "" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      const [group] = await caller.links.create({ label: "Links" });
      if (!group) throw new Error("Link group insert failed");
      await expect(caller.links.createLink({
        label: "XSS",
        href: "https://example.com",
        icon: '<svg onload="alert(1)"></svg>',
        sortOrder: 0,
        linkGroupId: group.id,
      })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(caller.links.createLink({
        label: "Site",
        href: "https://example.com",
        icon: DEFAULT_LINK_ICON,
        sortOrder: 0,
        linkGroupId: group.id,
      })).resolves.toHaveLength(1);
    } finally {
      await miniflare.dispose();
    }
  });

  test("binds administrator access to the GitHub account ID, not the login", async () => {
    const { miniflare, binding } = await createTestD1("fsx-admin-identity");

    try {
      const db = createDb(binding);
      await insertGithubUser(db, "owner-id", "renamed-owner", TEST_OWNER_GITHUB_ID);
      await insertGithubUser(db, "impostor-id", "owner", "2002");
      await db.insert(user).values({ id: "no-account-id", name: "owner", email: "x@example.com" });

      await expect(callerAs(db, { id: "owner-id", name: "renamed-owner" }).stats.counts())
        .resolves.toBeDefined();
      await expect(callerAs(db, { id: "impostor-id", name: "owner" }).stats.counts())
        .rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(callerAs(db, { id: "no-account-id", name: "owner" }).stats.counts())
        .rejects.toMatchObject({ code: "FORBIDDEN" });
    } finally {
      await miniflare.dispose();
    }
  });

  test("treats LIKE wildcards literally and validates age groups and dates", async () => {
    const { miniflare, binding } = await createTestD1("fsx-admin-filters");

    try {
      const caller = await adminCaller(createDb(binding));
      const year = new Date().getUTCFullYear();
      const base = { blitz: 1500, rapid: 1500, classic: 1500, sex: "male" as const, active: true };
      await caller.players.create({ ...base, name: "Ana_Maria", birthDate: `${year - 9}-06-01` });
      await caller.players.create({ ...base, name: "Anaxmaria", birthDate: `${year - 30}-06-01` });

      const underscore = await caller.players.page({ name: "ana_" });
      expect(underscore.players.map((player) => player.name)).toEqual(["Ana_Maria"]);
      expect(await caller.players.search({ query: "%" })).toEqual([]);

      const sub10 = await caller.players.withFilters({ groups: ["sub-10"] });
      expect(sub10.players.map((player) => player.name)).toEqual(["Ana_Maria"]);
      await expect(
        caller.players.withFilters({ groups: ["sub-11" as "sub-10"] }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await expect(
        caller.players.create({ ...base, name: "Data BR", birthDate: "01/06/2015" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    } finally {
      await miniflare.dispose();
    }
  });
});
