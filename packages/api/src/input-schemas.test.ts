import { describe, expect, test } from "bun:test";

import { filterArray, idInput, limit, page, rating } from "./input-schemas";

describe("bounded API inputs", () => {
  test("rejects invalid identifiers and fractional pagination", () => {
    expect(idInput.safeParse({ id: 0 }).success).toBe(false);
    expect(idInput.safeParse({ id: 1.5 }).success).toBe(false);
    expect(page.safeParse(0).success).toBe(false);
    expect(page.safeParse(1.5).success).toBe(false);
    expect(page.safeParse(1_001).success).toBe(false);
    expect(limit.safeParse(101).success).toBe(false);
  });

  test("bounds ratings and filter arrays", () => {
    expect(rating.safeParse(-1).success).toBe(false);
    expect(rating.safeParse(4001).success).toBe(false);
    expect(filterArray.safeParse(Array.from({ length: 51 }, () => "club")).success).toBe(false);
  });
});
