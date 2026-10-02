import { describe, expect, test } from "bun:test";

import { calculateUpdatedRating } from "./rating-update";

describe("calculateUpdatedRating", () => {
  test("applies positive and negative tournament variations within the rating range", () => {
    expect(calculateUpdatedRating(1600, 25)).toBe(1625);
    expect(calculateUpdatedRating(1600, -25)).toBe(1575);
  });

  test("rejects a result outside the valid rating range", () => {
    expect(() => calculateUpdatedRating(10, -11)).toThrow();
    expect(() => calculateUpdatedRating(3999, 2)).toThrow();
  });
});
