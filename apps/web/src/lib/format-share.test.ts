import { describe, expect, test } from "bun:test";

import { formatShare } from "./format-share";

describe("formatShare", () => {
  test("keeps fractional precision below one percent", () => {
    expect(formatShare(0.005)).toBe("0,5%");
    expect(formatShare(0.0001)).toBe("0,01%");
  });

  test("keeps zero and whole percentages concise", () => {
    expect(formatShare(0)).toBe("0%");
    expect(formatShare(0.01)).toBe("1%");
    expect(formatShare(0.254)).toBe("25%");
  });
});
