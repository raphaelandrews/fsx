import { describe, expect, test } from "bun:test";

import { getProcedureCachePolicy, hasSessionCookie, isSuccessfulTrpcPayload, resolveProcedureTtl, shouldCachePublicQuery } from "./cache-policy";

describe("cache policy", () => {
  test("uses the shortest TTL in a batched request", () => {
    expect(resolveProcedureTtl("/api/trpc/clubs.list,players.search")).toBe(30);
  });

  test("uses the default TTL for unknown procedures", () => {
    expect(resolveProcedureTtl("/api/trpc/private.unknown")).toBe(60);
    expect(getProcedureCachePolicy("/api/trpc/private.unknown").classification).toBe("never");
    expect(getProcedureCachePolicy("/api/trpc/players.page").classification).toBe("never");
    expect(getProcedureCachePolicy("/api/trpc/clubs.list,private.unknown").classification).toBe("never");
  });

  test("only caches successful anonymous GET queries", () => {
    expect(shouldCachePublicQuery({ method: "GET", status: 200, authenticated: false })).toBe(true);
    expect(shouldCachePublicQuery({ method: "GET", status: 500, authenticated: false })).toBe(false);
    expect(shouldCachePublicQuery({ method: "GET", status: 200, authenticated: true })).toBe(false);
    expect(shouldCachePublicQuery({ method: "POST", status: 200, authenticated: false })).toBe(false);
    expect(shouldCachePublicQuery({ method: "GET", status: 200, authenticated: false, cacheable: false })).toBe(false);
  });

  test("recognizes Better Auth cookie variants", () => {
    expect(hasSessionCookie("better-auth.session_token=abc")).toBe(true);
    expect(hasSessionCookie("__Secure-better-auth.session_token=abc")).toBe(true);
    expect(hasSessionCookie("__Host-better-auth.session_token=abc")).toBe(true);
    expect(hasSessionCookie("theme=dark")).toBe(false);
  });

  test("rejects batched payloads containing procedure errors", () => {
    expect(isSuccessfulTrpcPayload({ result: { data: [] } })).toBe(true);
    expect(isSuccessfulTrpcPayload([{ result: { data: [] } }, { error: { message: "failed" } }])).toBe(false);
  });
});
