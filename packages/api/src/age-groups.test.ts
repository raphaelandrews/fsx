import { describe, expect, test } from "bun:test";

import { AGE_GROUPS, getBirthYearRange, isAgeGroup } from "./age-groups";

describe("age groups", () => {
  test("recognizes only known group keys", () => {
    expect(AGE_GROUPS.every(isAgeGroup)).toBe(true);
    expect(isAgeGroup("sub-11")).toBe(false);
  });

  test("maps groups to birth-year ranges for the given year", () => {
    expect(getBirthYearRange("sub-10", 2026)).toEqual([2016, 2017]);
    expect(getBirthYearRange("senior", 2026)).toEqual([1900, 1961]);
  });
});
