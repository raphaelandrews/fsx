import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { config } from "dotenv";

// Shared secrets for both envs — single source of truth.
config({ path: "../../apps/web/.env.common", override: true });
// Dev-specific domain URLs (localhost). Loaded non-overriding so common wins.
config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("fsx");

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  bindings: {
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    GITHUB_CLIENT_ID: alchemy.secret.env.GITHUB_CLIENT_ID!,
    GITHUB_CLIENT_SECRET: alchemy.secret.env.GITHUB_CLIENT_SECRET!,
    GITHUB_USERNAME: alchemy.env.GITHUB_USERNAME ?? "",
    DISABLE_SIGNUP: alchemy.env.DISABLE_SIGNUP ?? "",
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
