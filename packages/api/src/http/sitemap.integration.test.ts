import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller } from "../test-admin";
import { createTestD1 } from "../test-d1";
import { mockWorkerEnv } from "../test-env";

mockWorkerEnv();

const { appRouter } = await import("../routers/index");
const { getSitemapEntries } = await import("./sitemap");

let dispose: () => Promise<void>;
let db: ReturnType<typeof createDb>;
let tournamentId: number;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-sitemap");
  db = createDb(d1.binding);
  const caller = await ownerCaller(appRouter.createCaller, db);
  const [created] = await caller.tournaments.create({ name: "Torneio no Sitemap", ratingType: "rapid" });
  tournamentId = created!.id;
  dispose = () => d1.miniflare.dispose();
});

afterAll(async () => {
  await dispose();
});

describe("sitemap entries", () => {
  test("list every tournament, since each has its own public page", async () => {
    expect((await getSitemapEntries(db)).tournamentIds).toContain(tournamentId);
  });
});
