import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import type { Context } from "./context";
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
    await expect(caller().players.options()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller().players.forEdit({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
