import { describe, expect, test } from "bun:test";

import { httpUrlError, integerError, maxLengthError, requiredText } from "./field-rules";

describe("field rules", () => {
  test("requiredText rejects blanks and over-long values", () => {
    const rule = requiredText("Name", 5);
    expect(rule({ value: "   " })).toBe("Name is required");
    expect(rule({ value: "abcdef" })).toBe("Name must be at most 5 characters");
    expect(rule({ value: " abc " })).toBeUndefined();
  });

  test("httpUrlError accepts only http(s) URLs and allows empty", () => {
    expect(httpUrlError("URL", "")).toBeUndefined();
    expect(httpUrlError("URL", "https://example.com/x")).toBeUndefined();
    expect(httpUrlError("URL", "javascript:alert(1)")).toBe("URL must start with http:// or https://");
    expect(httpUrlError("URL", "example.com")).toBe("URL must be a valid URL");
  });

  test("integerError rejects NaN, decimals and out-of-range values", () => {
    expect(integerError("Rapid", Number.NaN, 0, 4000)).toBeDefined();
    expect(integerError("Rapid", 10.5, 0, 4000)).toBeDefined();
    expect(integerError("Rapid", 4001, 0, 4000)).toBeDefined();
    expect(integerError("Rapid", 1900, 0, 4000)).toBeUndefined();
  });

  test("maxLengthError trims before counting", () => {
    expect(maxLengthError("Nickname", "  ab  ", 2)).toBeUndefined();
    expect(maxLengthError("Nickname", "abc", 2)).toBeDefined();
  });
});
