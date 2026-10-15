// Deploy entrypoint — same infra as alchemy.run.ts, but loads the PRODUCTION
// env (apps/web/.env.common shared secrets + apps/web/.env.prod domain URLs)
// into process.env BEFORE the shared dev entrypoint runs. No duplication:
// .env.common is the single source of truth for secrets.
import { config } from "dotenv";

config({ path: "../../apps/web/.env.common", override: true });
config({ path: "../../apps/web/.env.prod", override: true });

// Dev entrypoint — its non-overriding config() calls become no-ops because
// process.env already holds the prod values loaded above.
await import("./alchemy.run");
