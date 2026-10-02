import { mock } from "bun:test";

export const TEST_OWNER_GITHUB_ID = "1001";

export const testEnv: Record<string, unknown> = {
  DB: {},
  CORS_ORIGIN: "http://localhost:3001",
  GITHUB_USER_ID: TEST_OWNER_GITHUB_ID,
  GITHUB_USERNAME: "owner",
  BETTER_AUTH_SECRET: "test-secret",
  BETTER_AUTH_URL: "http://localhost:3001",
  GITHUB_CLIENT_ID: "test-client",
  GITHUB_CLIENT_SECRET: "test-secret",
  IMAGES: {},
};

// Bun shares module mocks across test files in one process, so every suite
// installs this one mutable environment and swaps bindings per test.
export function mockWorkerEnv() {
  mock.module("cloudflare:workers", () => ({ env: testEnv }));
}
