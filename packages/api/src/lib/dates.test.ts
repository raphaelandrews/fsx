import { describe, expect, test } from "bun:test";

import { federationDayBounds, federationDayOf } from "./dates";

describe("federation days", () => {
  test("an evening import belongs to its local day", () => {
    expect(federationDayOf("2030-03-11 01:30:00.000")).toBe("2030-03-10");
    expect(federationDayOf("2030-03-10 03:00:00")).toBe("2030-03-10");
    expect(federationDayOf("2030-03-10 02:59:59.999")).toBe("2030-03-09");
  });

  test("a day's bounds are the UTC instants of its local midnights", () => {
    expect(federationDayBounds("2030-03-10")).toEqual({ start: "2030-03-10 03:00:00.000", end: "2030-03-11 03:00:00.000" });
    expect(federationDayBounds("2030-12-31").end).toBe("2031-01-01 03:00:00.000");
  });
});
