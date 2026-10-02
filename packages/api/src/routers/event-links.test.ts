import { describe, expect, test } from "bun:test";

import { requireOwnedEventLink, validateEventLinkTypes } from "./event-links";

describe("event link validation", () => {
  test("rejects duplicate event link types", () => {
    expect(() => validateEventLinkTypes(["regulation", "regulation"])).toThrow(
      "Each event link type can only be provided once",
    );
  });

  test("rejects links owned by another event group", () => {
    expect(() => requireOwnedEventLink(new Set([1, 2]), 3)).toThrow("Event link not found");
  });

  test("accepts an existing link in the event group", () => {
    expect(() => requireOwnedEventLink(new Set([1, 2]), 2)).not.toThrow();
  });
});
