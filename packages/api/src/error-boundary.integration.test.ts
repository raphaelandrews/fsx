import { describe, expect, spyOn, test } from "bun:test";

import { createDb } from "@fsx/db";

import type { Context } from "./context";
import { callerAs, ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");
const { handleTrpcRequest } = await import("./trpc-handler");

describe("procedure error boundary", () => {
  test("turns constraint violations into CONFLICT without leaking SQL, and logs once", async () => {
    const { miniflare, binding } = await createTestD1("fsx-error-boundary");
    const logged = spyOn(console, "warn").mockImplementation(() => {});
    try {
      const caller = await ownerCaller(appRouter.createCaller, createDb(binding));
      await caller.clubs.create({ name: "Duplicado" });

      const error = await caller.clubs.create({ name: "Duplicado" }).catch((caught: unknown) => caught);
      expect(error).toMatchObject({ code: "CONFLICT", message: "The submitted data conflicts with an existing record." });
      expect(String((error as Error).message)).not.toMatch(/insert|clubs|Failed query/i);

      const failures = logged.mock.calls.filter(([label]) => label === "[trpc] procedure rejected");
      expect(failures).toHaveLength(1);
      expect(failures[0]![1]).toMatchObject({ path: "clubs.create", code: "CONFLICT" });
    } finally {
      logged.mockRestore();
      await miniflare.dispose();
    }
  });

  test("hides unexpected infrastructure errors behind a generic message and logs them as errors", async () => {
    const logged = spyOn(console, "error").mockImplementation(() => {});
    try {
      const failingDb = new Proxy({}, {
        get: () => {
          throw new Error("D1_ERROR: SQLITE_BUSY secret detail");
        },
      }) as Context["db"];
      const caller = callerAs(appRouter.createCaller, failingDb, null);
      await expect(caller.norms.list()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      });
      expect(logged).toHaveBeenCalledWith("[trpc] procedure failed", expect.objectContaining({ path: "norms.list" }));
    } finally {
      logged.mockRestore();
    }
  });

  test("keeps validation errors and their field details", async () => {
    const caller = callerAs(appRouter.createCaller, {} as Context["db"], null);
    await expect(caller.players.byId({ id: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("never returns SQL in HTTP error bodies", async () => {
    const { miniflare, binding } = await createTestD1("fsx-error-boundary-http");
    const logged = spyOn(console, "error").mockImplementation(() => {});
    testEnv.DB = binding;
    try {
      await binding.prepare("DROP TABLE norms").run();
      const response = await handleTrpcRequest(new Request("http://localhost:3001/api/trpc/norms.list"));
      const body = await response.text();
      expect(response.status).toBe(500);
      expect(body).toContain("An unexpected server error occurred.");
      expect(body).not.toMatch(/select|norms"|no such table|Failed query/i);
      expect((JSON.parse(body) as { error: { data: { userMessage: unknown } } }).error.data.userMessage).toBeNull();
    } finally {
      logged.mockRestore();
      await miniflare.dispose();
    }
  });
});

describe("error response shape", () => {
  test("never includes stack traces outside development builds", async () => {
    const response = await handleTrpcRequest(
      new Request(`http://localhost:3001/api/trpc/players.byId?input=${encodeURIComponent(JSON.stringify({ id: 0 }))}`),
    );
    const body = await response.json() as { error: { data: Record<string, unknown> } };
    expect(response.status).toBe(400);
    expect(body.error.data.stack).toBeUndefined();
    expect(body.error.data.zodError).toBeDefined();
    expect(body.error.data.userMessage).toBeNull();
  });

  test("exposes the message of an intentional rejection as userMessage", async () => {
    const response = await handleTrpcRequest(
      new Request(`http://localhost:3001/api/trpc/stats.counts`),
    );
    const body = await response.json() as { error: { data: Record<string, unknown> } };
    expect(response.status).toBe(401);
    expect(body.error.data.userMessage).toBe("Authentication required");
  });
});
