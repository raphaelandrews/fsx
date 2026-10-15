import { afterEach, describe, expect, spyOn, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

afterEach(() => {
  delete testEnv.CLOUDFLARE_ZONE_ID;
  delete testEnv.CLOUDFLARE_CACHE_PURGE_TOKEN;
});

describe("cache.purgePublic", () => {
  test("reports missing configuration, purges every data center, and surfaces API failures", async () => {
    const { miniflare, binding } = await createTestD1("fsx-cache-purge");
    const fetchSpy = spyOn(globalThis, "fetch");
    try {
      const caller = await ownerCaller(appRouter.createCaller, createDb(binding));

      expect(await caller.cache.status()).toEqual({ purgeConfigured: false });
      await expect(caller.cache.purgePublic()).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      expect(fetchSpy).not.toHaveBeenCalled();

      testEnv.CLOUDFLARE_ZONE_ID = "zone-123";
      testEnv.CLOUDFLARE_CACHE_PURGE_TOKEN = "token-abc";
      expect(await caller.cache.status()).toEqual({ purgeConfigured: true });

      fetchSpy.mockResolvedValueOnce(Response.json({ success: true }));
      await expect(caller.cache.purgePublic()).resolves.toMatchObject({ purgedAt: expect.any(String) });
      const [url, init] = fetchSpy.mock.calls[0]!;
      expect(url).toBe("https://api.cloudflare.com/client/v4/zones/zone-123/purge_cache");
      expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer token-abc" });
      expect(JSON.parse(String((init as RequestInit).body))).toEqual({ purge_everything: true });

      fetchSpy.mockResolvedValueOnce(Response.json({ success: false }, { status: 403 }));
      await expect(caller.cache.purgePublic()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    } finally {
      fetchSpy.mockRestore();
      await miniflare.dispose();
    }
  });
});
