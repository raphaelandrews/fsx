import { beforeEach, describe, expect, test } from "bun:test";

import { mockWorkerEnv, testEnv, TEST_OWNER_GITHUB_ID } from "./test-env";

mockWorkerEnv();

const { createAuth } = await import("@fsx/auth");

const baseEnv = { ...testEnv };

function configure(overrides: Record<string, unknown>) {
  Object.assign(testEnv, baseEnv, { DB: {} }, overrides);
  const options = createAuth().options;
  return {
    mapProfile: options.socialProviders!.github!.mapProfileToUser!,
    beforeCreate: options.databaseHooks!.user!.create!.before!,
  };
}

const profile = (id: number, login = "someone") => ({ id, login }) as unknown as Parameters<ReturnType<typeof configure>["mapProfile"]>[0];

beforeEach(() => {
  Object.assign(testEnv, baseEnv);
});

describe("sign-in lock", () => {
  test("lets the owner's GitHub account in and names the user after the login", async () => {
    const { mapProfile } = configure({});
    expect(await mapProfile(profile(Number(TEST_OWNER_GITHUB_ID), "owner-login"))).toEqual({ name: "owner-login" });
  });

  test("rejects any other GitHub account before a user can be created", async () => {
    const { mapProfile } = configure({});
    await expect(Promise.resolve().then(() => mapProfile(profile(999)))).rejects.toMatchObject({ status: "FORBIDDEN" });
  });

  test("refuses everyone over https while GITHUB_USER_ID is empty", async () => {
    const { mapProfile } = configure({
      BETTER_AUTH_URL: "https://fsx.example",
      GITHUB_USER_ID: "",
      GITHUB_USERNAME: "owner",
    });
    await expect(Promise.resolve().then(() => mapProfile(profile(Number(TEST_OWNER_GITHUB_ID), "owner")))).rejects.toMatchObject({
      status: "FORBIDDEN",
    });
  });

  test("with a configured login, only that login may create a user", async () => {
    const { beforeCreate } = configure({ GITHUB_USER_ID: "", GITHUB_USERNAME: "Owner" });
    const row = { id: "u1", email: "a@b.c", emailVerified: false, createdAt: new Date(), updatedAt: new Date() };
    expect(await beforeCreate({ ...row, name: "owner" })).toBeUndefined();
    expect(await beforeCreate({ ...row, name: "intruder" })).toBe(false);
  });
});
