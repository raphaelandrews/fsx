import { describe, expect, test } from "bun:test";
import { isNotFound } from "@tanstack/react-router";

import { idParams } from "./route-params";

function parseError(id: string): unknown {
  try {
    idParams.parse({ id });
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("idParams", () => {
  test("parses positive integer ids and stringifies them back", () => {
    expect(idParams.parse({ id: "42" })).toEqual({ id: 42 });
    expect(idParams.stringify({ id: 42 })).toEqual({ id: "42" });
  });

  test("turns malformed ids into not-found instead of API errors", () => {
    for (const id of ["abc", "0", "-1", "1.5", "1e3", "01", " 1", "9007199254740993"]) {
      expect(isNotFound(parseError(id))).toBe(true);
    }
  });
});
