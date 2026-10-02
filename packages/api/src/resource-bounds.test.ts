import { describe, expect, test } from "bun:test";

import {
  measureResponseBytes,
  PUBLIC_COLLECTION_LIMIT,
  PUBLIC_NESTED_COLLECTION_LIMIT,
  PUBLIC_RESPONSE_SIZE_BUDGET_BYTES,
} from "./resource-bounds";

describe("public resource bounds", () => {
  test("keep collection and nested graph caps finite", () => {
    expect(PUBLIC_COLLECTION_LIMIT).toBeGreaterThan(0);
    expect(PUBLIC_COLLECTION_LIMIT).toBeLessThanOrEqual(500);
    expect(PUBLIC_NESTED_COLLECTION_LIMIT).toBeLessThan(PUBLIC_COLLECTION_LIMIT);
  });

  test("measures serialized payload bytes against the public response budget", () => {
    const serialized = JSON.stringify({ text: "á".repeat(200_000) });

    expect(measureResponseBytes(serialized)).toBeGreaterThan(400_000);
    expect(measureResponseBytes(serialized)).toBeLessThan(PUBLIC_RESPONSE_SIZE_BUDGET_BYTES);
  });
});
