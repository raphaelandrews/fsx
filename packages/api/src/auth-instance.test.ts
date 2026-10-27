import { describe, expect, test } from "bun:test";

import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { createAuth } = await import("@fsx/auth");

describe("createAuth", () => {
  test("builds Better Auth once per D1 binding", () => {
    expect(createAuth()).toBe(createAuth());
  });
});
