import { defineConfig, devices } from "@playwright/test";

import { E2E_ORIGIN } from "./e2e/fixtures";

// Run `bun run build` first: the server runs the built worker and assets.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  // One seeded D1 is shared by every test, so specs run serially.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: E2E_ORIGIN,
    locale: "pt-BR",
    timezoneId: "America/Maceio",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun scripts/e2e-server.ts",
    url: E2E_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
