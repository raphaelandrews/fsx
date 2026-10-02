import { describe, expect, test } from "bun:test";

import { filterArray, httpUrl, idInput, imageUrl, isoDate, limit, mediaPath, optionalHttpUrl, page, rating } from "./input-schemas";

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

describe("URL inputs", () => {
  const media = "/api/media/posts/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0.png";

  test("accepts only http(s) for external links", () => {
    expect(httpUrl.safeParse(" https://example.com/x ").data).toBe("https://example.com/x");
    for (const value of ["javascript:alert(1)", "data:text/html,x", "mailto:a@b.c", media]) {
      expect(httpUrl.safeParse(value).success).toBe(false);
    }
    expect(optionalHttpUrl.safeParse("").success).toBe(true);
  });

  test("accepts uploaded media paths and external URLs for images", () => {
    expect(mediaPath.safeParse(media).success).toBe(true);
    expect(imageUrl.safeParse(media).success).toBe(true);
    expect(imageUrl.safeParse("https://example.com/a.jpg").success).toBe(true);
    for (const value of ["/api/media/other/abc.png", "/api/media/posts/../x.png", "/api/media/posts/abc.svg", "javascript:alert(1)"]) {
      expect(imageUrl.safeParse(value).success).toBe(false);
    }
  });
});

describe("date inputs", () => {
  test("accepts only calendar-valid YYYY-MM-DD dates", () => {
    expect(isoDate.safeParse("2010-05-03").success).toBe(true);
    for (const value of ["03/05/2010", "2010-13-01", "2010-05-03T00:00:00Z", ""]) {
      expect(isoDate.safeParse(value).success).toBe(false);
    }
  });
});
