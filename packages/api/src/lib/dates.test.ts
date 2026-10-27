import { describe, expect, test } from "bun:test";

import { federationDayOf } from "./dates";

describe("federation days", () => {
  test("an evening import belongs to its local day", () => {
    expect(federationDayOf("2030-03-11 01:30:00.000")).toBe("2030-03-10");
    expect(federationDayOf("2030-03-10 03:00:00")).toBe("2030-03-10");
    expect(federationDayOf("2030-03-10 02:59:59.999")).toBe("2030-03-09");
  });
});
