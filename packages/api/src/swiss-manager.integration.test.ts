import { describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";
import { clubs } from "@fsx/db/schema/clubs";
import { players } from "@fsx/db/schema/players";

import { getProcedureCachePolicy } from "./cache-policy";
import { callerAs } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

describe("swissManager.list", () => {
  test("is public, edge-cached, and includes the columns Swiss Manager imports", async () => {
    const { miniflare, binding } = await createTestD1("fsx-swiss-manager");
    try {
      const db = createDb(binding);
      const [club] = await db.insert(clubs).values({ name: "Clube Suíço" }).returning();
      await db.insert(players).values([
        { name: "Ana Rápida", normalizedName: "ana rapida", sex: "female", birthDate: "2010-04-02", rapid: 1900, clubId: club!.id },
        { name: "Beto", normalizedName: "beto", sex: "male", rapid: 1500 },
      ]);

      const anonymous = callerAs(appRouter.createCaller, db, null);
      expect(await anonymous.swissManager.list()).toEqual([
        expect.objectContaining({ name: "Ana Rápida", sex: "female", birthDate: "2010-04-02", rapid: 1900, club: { id: club!.id, name: "Clube Suíço" } }),
        expect.objectContaining({ name: "Beto", birthDate: null, club: null }),
      ]);
      expect(getProcedureCachePolicy("/api/trpc/swissManager.list")).toEqual({ classification: "public", ttlSeconds: 300 });
    } finally {
      await miniflare.dispose();
    }
  });
});
