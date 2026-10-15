import { describe, expect, test } from "bun:test";

import { isAdministrator, isAllowedGithubAccount, resolveAdminRule } from "./owner";

describe("resolveAdminRule", () => {
  test("prefers the GitHub account ID over the login and first user", () => {
    expect(resolveAdminRule({ ownerGithubId: " 123 ", configuredUsername: "owner" })).toEqual({
      kind: "githubId",
      ownerGithubId: "123",
    });
    expect(resolveAdminRule({ ownerGithubId: "", configuredUsername: " Owner " })).toEqual({
      kind: "username",
      configuredUsername: "owner",
    });
    expect(resolveAdminRule({ ownerGithubId: undefined, configuredUsername: undefined })).toEqual({
      kind: "firstUser",
    });
  });
});

describe("isAdministrator", () => {
  const byId = resolveAdminRule({ ownerGithubId: "123", configuredUsername: "owner" });

  test("keeps the owner after a GitHub login rename", () => {
    expect(isAdministrator(byId, {
      userId: "user-1",
      userName: "renamed-owner",
      githubAccountIds: ["123"],
    })).toBe(true);
  });

  test("rejects a different account that reuses the old login", () => {
    expect(isAdministrator(byId, {
      userId: "user-2",
      userName: "owner",
      githubAccountIds: ["999"],
    })).toBe(false);
    expect(isAdministrator(byId, { userId: "user-3", userName: "owner" })).toBe(false);
  });

  test("falls back to the configured login case-insensitively", () => {
    const byName = resolveAdminRule({ ownerGithubId: "", configuredUsername: "raphael" });
    expect(isAdministrator(byName, { userId: "user-1", userName: "  Raphael  " })).toBe(true);
    expect(isAdministrator(byName, { userId: "user-2", userName: "other" })).toBe(false);
  });

  test("falls back to the first account when nothing is configured", () => {
    const firstUser = resolveAdminRule({ ownerGithubId: "", configuredUsername: "" });
    expect(isAdministrator(firstUser, { userId: "user-1", userName: "a", firstUserId: "user-1" })).toBe(true);
    expect(isAdministrator(firstUser, { userId: "user-2", userName: "b", firstUserId: "user-1" })).toBe(false);
  });
});

describe("isAllowedGithubAccount", () => {
  test("only the configured GitHub ID may sign in when one is set", () => {
    const byId = resolveAdminRule({ ownerGithubId: "123", configuredUsername: "" });
    expect(isAllowedGithubAccount(byId, "123")).toBe(true);
    expect(isAllowedGithubAccount(byId, "999")).toBe(false);
    expect(isAllowedGithubAccount(resolveAdminRule({ ownerGithubId: "", configuredUsername: "x" }), "999")).toBe(true);
  });
});
