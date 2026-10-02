import { describe, expect, test } from "bun:test";

import { isAdministrator } from "./authorization";

describe("isAdministrator", () => {
  test("allows the configured GitHub username case-insensitively", () => {
    expect(
      isAdministrator({
        userId: "user-1",
        userName: "  Raphael  ",
        configuredUsername: "raphael",
        firstUserId: "user-2",
      }),
    ).toBe(true);
  });

  test("rejects a different configured username", () => {
    expect(
      isAdministrator({
        userId: "user-2",
        userName: "other",
        configuredUsername: "raphael",
        firstUserId: "user-2",
      }),
    ).toBe(false);
  });

  test("uses the first account when no username lock is configured", () => {
    expect(
      isAdministrator({
        userId: "user-1",
        userName: "first",
        configuredUsername: "",
        firstUserId: "user-1",
      }),
    ).toBe(true);
    expect(
      isAdministrator({
        userId: "user-2",
        userName: "second",
        configuredUsername: undefined,
        firstUserId: "user-1",
      }),
    ).toBe(false);
  });
});
