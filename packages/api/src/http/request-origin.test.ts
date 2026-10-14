import { describe, expect, test } from "bun:test";

import { isTrustedOrigin } from "./request-origin";

const base = {
  requestUrl: "https://fsx.example/api/trpc",
  configuredOrigin: "https://fsx.example/",
};

describe("isTrustedOrigin", () => {
  test("requires an origin for state-changing requests", () => {
    expect(isTrustedOrigin({ ...base, origin: null, requireOrigin: true })).toBe(false);
    expect(isTrustedOrigin({ ...base, origin: null })).toBe(true);
  });

  test("accepts same-origin and configured-origin requests", () => {
    expect(isTrustedOrigin({ ...base, origin: "https://fsx.example" })).toBe(true);
    expect(isTrustedOrigin({ ...base, origin: "https://fsx.example:443" })).toBe(true);
  });

  test("rejects malformed and cross-origin requests", () => {
    expect(isTrustedOrigin({ ...base, origin: "not-an-origin" })).toBe(false);
    expect(isTrustedOrigin({ ...base, origin: "https://attacker.example" })).toBe(false);
  });
});
