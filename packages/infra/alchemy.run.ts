import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { D1Database, R2Bucket } from "alchemy/cloudflare";
import { config } from "dotenv";

// Shared secrets for both envs — single source of truth.
config({ path: "../../apps/web/.env.common", override: true });
// Dev-specific domain URLs (localhost). Loaded non-overriding so common wins.
config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("fsx");

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
  // Adopt the existing remote D1 database (fsx-database-raphael) if it
  // already exists instead of failing on re-deploy.
  adopt: true,
});

// R2 bucket for player and post images. Objects are served to clients through
// the /api/media/* route (apps/web/src/routes/api/media/$.ts), so the bucket
// does not need a public custom domain. `adopt: true` lets re-deploys pick up
// the existing bucket instead of failing if it was created earlier.
const images = await R2Bucket("images", {
  name: "fsx-images",
  adopt: true,
});

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  // Adopt the existing remote worker (fsx-web-raphael) if it already exists
  // instead of failing on re-deploy.
  adopt: true,
  bindings: {
    DB: db,
    IMAGES: images,
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
