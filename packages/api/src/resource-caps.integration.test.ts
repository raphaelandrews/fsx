import { describe, expect, spyOn, test } from "bun:test";

import { createDb } from "@fsx/db";

import { PUBLIC_COLLECTION_LIMIT } from "./resource-bounds";
import { callerAs } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

describe("collection caps", () => {
  test("warns when a public list comes back at its row cap", async () => {
    const { miniflare, binding } = await createTestD1("fsx-resource-caps");
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      await binding.prepare(
        `WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${PUBLIC_COLLECTION_LIMIT + 5})
         INSERT INTO clubs (name) SELECT 'Clube ' || i FROM n`,
      ).run();
      const caller = callerAs(appRouter.createCaller, createDb(binding), null);

      expect(await caller.clubs.list()).toHaveLength(PUBLIC_COLLECTION_LIMIT);
      expect(warn).toHaveBeenCalledWith("[resource] collection reached its row cap", expect.objectContaining({
        path: "clubs.list",
        limit: PUBLIC_COLLECTION_LIMIT,
      }));

      warn.mockClear();
      await caller.locations.list();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      await miniflare.dispose();
    }
  });
});
