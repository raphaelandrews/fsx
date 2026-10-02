import { describe, expect, test } from "bun:test";

import { AGE_GROUPS, getBirthDateRange, isAgeGroup } from "./age-groups";

describe("age groups", () => {
  test("recognizes only known group keys", () => {
    expect(AGE_GROUPS.every(isAgeGroup)).toBe(true);
    expect(isAgeGroup("sub-11")).toBe(false);
  });

  test("maps groups to ISO birth-date ranges for the given year", () => {
    expect(getBirthDateRange("sub-10", 2026)).toEqual(["2016-01-01", "2017-12-31"]);
    expect(getBirthDateRange("senior", 2026)).toEqual(["1900-01-01", "1961-12-31"]);
  });
});
