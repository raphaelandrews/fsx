import { describe, expect, test } from "bun:test";

import { parseDbTimestamp, toIsoTimestamp } from "./format";

describe("parseDbTimestamp", () => {
  test("reads D1 timestamps as UTC regardless of the runtime zone", () => {
    expect(parseDbTimestamp("2026-10-13 23:30:00").toISOString()).toBe("2026-10-13T23:30:00.000Z");
  });

  test("keeps values that already carry a zone", () => {
    expect(parseDbTimestamp("2026-10-13T23:30:00.000Z").toISOString()).toBe(
      "2026-10-13T23:30:00.000Z",
    );
    expect(parseDbTimestamp("2026-10-13T20:30:00-03:00").toISOString()).toBe(
      "2026-10-13T23:30:00.000Z",
    );
  });
});

describe("toIsoTimestamp", () => {
  test("returns ISO 8601 or undefined", () => {
    expect(toIsoTimestamp("2026-10-13 12:00:00")).toBe("2026-10-13T12:00:00.000Z");
    expect(toIsoTimestamp(null)).toBeUndefined();
    expect(toIsoTimestamp("garbage")).toBeUndefined();
  });
});
