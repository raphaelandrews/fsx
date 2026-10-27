import { describe, expect, test } from "bun:test";

import type { EntityField } from "@/components/admin/entity-form";

import { maxLengthOf, validateField } from "./entity-validation";

const text = (extra: Partial<EntityField> = {}) =>
  ({ name: "name", label: "Name", kind: "text", ...extra }) as EntityField;
const number = (extra: Record<string, unknown> = {}) =>
  ({ name: "level", label: "Level", kind: "number", ...extra }) as EntityField;

describe("validateField", () => {
  test("required fields reject blank input, optional fields accept it", () => {
    expect(validateField(text({ required: true }), "   ")).toBe("Name is required");
    expect(validateField(text(), "   ")).toBeUndefined();
  });

  test("text respects the field limit and the default", () => {
    expect(validateField(text({ maxLength: 4 }), "abcde")).toContain("4");
    expect(validateField(text({ maxLength: 4 }), "abcd")).toBeUndefined();
    expect(maxLengthOf(text())).toBe(160);
    expect(maxLengthOf({ name: "t", label: "T", kind: "url" })).toBe(2048);
    expect(maxLengthOf({ name: "t", label: "T", kind: "textarea" })).toBeGreaterThan(160);
  });

  test("numbers must be whole and inside the bounds", () => {
    const field = number({ min: 1, max: 100 });
    expect(validateField(field, "1.5")).toBe("Level must be a whole number");
    expect(validateField(field, "abc")).toBe("Level must be a whole number");
    expect(validateField(field, "0")).toBe("Level must be at least 1");
    expect(validateField(field, "101")).toBe("Level must be at most 100");
    expect(validateField(field, "50")).toBeUndefined();
  });

  test("urls must be http(s)", () => {
    const field = { name: "u", label: "Link", kind: "url" } as EntityField;
    expect(validateField(field, "javascript:alert(1)")).toBeDefined();
    expect(validateField(field, "https://example.com/a")).toBeUndefined();
  });
});

describe("long text", () => {
  test("rejects text that fits the character limit but not a D1 row", () => {
    const field = { kind: "textarea", label: "Content", name: "content" } as Parameters<typeof validateField>[0];
    expect(validateField(field, "😀".repeat(480_000))).toBe("Content is too large");
    expect(validateField(field, "a".repeat(1000))).toBeUndefined();
  });
});
