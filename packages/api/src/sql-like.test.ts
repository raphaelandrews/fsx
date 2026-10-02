import { describe, expect, test } from "bun:test";

import { escapeLike } from "./sql-like";

describe("escapeLike", () => {
  test("escapes wildcards and the escape character", () => {
    expect(escapeLike("100%_a\\b")).toBe("100\\%\\_a\\\\b");
    expect(escapeLike("plain")).toBe("plain");
  });
});
