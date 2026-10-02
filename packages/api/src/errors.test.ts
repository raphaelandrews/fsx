import { describe, expect, test } from "bun:test";

import { requireAffectedRows, requireMutationRows } from "./errors";

describe("mutation error helpers", () => {
  test("returns mutation rows when a record was changed", () => {
    expect(requireMutationRows([{ id: 1 }], "Player")).toEqual([{ id: 1 }]);
  });

  test("raises NOT_FOUND when no record was changed", () => {
    expect(() => requireMutationRows([], "Player")).toThrow("Player not found");
    expect(() => requireAffectedRows(0, "Player")).toThrow("Player not found");
  });
});
