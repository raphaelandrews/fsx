import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { PROCEDURE_CACHE_POLICY } from "./cache-policy";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

function caller() {
  const ctx = {
    db: {} as Context["db"],
    session: null,
    requestId: "test-request",
  } satisfies Partial<Context> as Context;

  return appRouter.createCaller(ctx);
}

describe("tRPC caller boundaries", () => {
  test("rejects invalid procedure input before touching the repository", async () => {
    await expect(caller().players.byId({ id: 0 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("requires an authenticated session for protected and admin procedures", async () => {
    await expect(caller().players.create({
      name: "Test",
      blitz: 1800,
      rapid: 1800,
      classic: 1800,
      sex: "male",
    })).rejects.toBeInstanceOf(TRPCError);
    await expect(caller().players.page({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller().players.forEdit({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("edge cache registry", () => {
  const procedures = (appRouter._def as unknown as { procedures: Record<string, { _def: { type: string } }> }).procedures;
  const queries = Object.entries(procedures)
    .filter(([, procedure]) => procedure._def.type === "query")
    .map(([path]) => path);

  test("every registry entry names an existing query procedure", () => {
    for (const path of Object.keys(PROCEDURE_CACHE_POLICY)) {
      expect(queries, `${path} is in the cache registry but not a query`).toContain(path);
    }
  });

  test("every query without a registry entry rejects anonymous callers", async () => {
    const unregistered = queries.filter((path) => !(path in PROCEDURE_CACHE_POLICY));
    for (const path of unregistered) {
      const call = path.split(".").reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)[key],
        caller(),
      ) as (input?: unknown) => Promise<unknown>;
      await expect(call(undefined), `${path} is public but has no cache policy`).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
  });
});
