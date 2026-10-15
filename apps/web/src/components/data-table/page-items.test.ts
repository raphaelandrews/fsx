import { describe, expect, test } from "bun:test";

import { buildPageItems } from "./page-items";

const render = (current: number, total: number, siblings = 1) =>
  buildPageItems(current, total, siblings)
    .map((item) => (item.type === "ellipsis" ? "…" : item.isCurrent ? `[${item.page}]` : String(item.page)))
    .join(" ");

describe("buildPageItems", () => {
  test("shows every page when they fit", () => {
    expect(render(1, 1)).toBe("[1]");
    expect(render(3, 7)).toBe("1 2 [3] 4 5 6 7");
  });

  test("fills the start before the first ellipsis", () => {
    expect(render(1, 119)).toBe("[1] 2 3 4 5 … 119");
    expect(render(4, 119)).toBe("1 2 3 [4] 5 … 119");
  });

  test("fills the end after the last ellipsis", () => {
    expect(render(119, 119)).toBe("1 … 115 116 117 118 [119]");
    expect(render(116, 119)).toBe("1 … 115 [116] 117 118 119");
  });

  test("centers the current page between two ellipses", () => {
    expect(render(5, 119)).toBe("1 … 4 [5] 6 … 119");
    expect(render(60, 119, 2)).toBe("1 … 58 59 [60] 61 62 … 119");
  });

  test("keeps the same number of items on every page", () => {
    const counts = new Set(Array.from({ length: 119 }, (_, i) => buildPageItems(i + 1, 119, 1).length));
    expect([...counts]).toEqual([7]);
  });
});
