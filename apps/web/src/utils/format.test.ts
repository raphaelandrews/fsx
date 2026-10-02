import { describe, expect, test } from "bun:test";

import { toIsoDate } from "./format";

describe("toIsoDate", () => {
  test("converts Brazilian day-first dates and keeps ISO dates", () => {
    expect(toIsoDate("3/5/2010")).toBe("2010-05-03");
    expect(toIsoDate(" 28/12/1990 ")).toBe("1990-12-28");
    expect(toIsoDate("2010-05-03")).toBe("2010-05-03");
  });

  test("passes unrecognized values through for the API to reject", () => {
    expect(toIsoDate("May 3 2010")).toBe("May 3 2010");
    expect(toIsoDate("")).toBe("");
  });
});
