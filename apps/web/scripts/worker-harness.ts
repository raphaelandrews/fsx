import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readFileSync } from "node:fs";

import { seedSyntheticData, type SyntheticCounts } from "@fsx/api/synthetic-data";
import { applyMigrations } from "@fsx/api/test-d1";
import { Miniflare } from "miniflare";

import { E2E_SECRET, OWNER_GITHUB_ID, OWNER_SESSION_TOKEN, PLAYER, POST } from "../e2e/fixtures";

const distDir = fileURLToPath(new URL("../dist/", import.meta.url));
const serverDir = join(distDir, "server");

// Bundles keep dynamic import() calls that Miniflare cannot statically follow,
// so every module is listed up front (the same as Wrangler's no_bundle mode).
function serverModules() {
  return [
    "index.js",
    ...readdirSync(join(serverDir, "assets"))
      .filter((file) => file.endsWith(".js"))
      .map((file) => `assets/${file}`),
  ].map((file) => ({ type: "ESModule" as const, path: join(serverDir, file) }));
}

const productionCounts = (): SyntheticCounts =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL("../../../packages/api/scripts/production-counts.json", import.meta.url)), "utf8"),
  );

export async function startWorker(options: {
  origin: string;
  port?: number;
  assets?: boolean;
  dataset?: "fixtures" | "production";
}) {
  const miniflare = new Miniflare({
    modulesRoot: serverDir,
    modules: serverModules(),
    compatibilityDate: "2026-07-30",
    compatibilityFlags: ["nodejs_compat", "nodejs_compat_populate_process_env"],
    d1Databases: { DB: "worker-harness" },
    r2Buckets: { IMAGES: "worker-harness-images" },
    ...(options.port ? { port: options.port, host: "127.0.0.1" } : {}),
    ...(options.assets
      ? {
          assets: {
            directory: join(distDir, "client"),
            binding: "ASSETS",
            routerConfig: { has_user_worker: true },
            assetConfig: { html_handling: "drop-trailing-slash" as const },
          },
        }
      : {}),
    bindings: {
      CORS_ORIGIN: options.origin,
      BETTER_AUTH_SECRET: E2E_SECRET,
      BETTER_AUTH_URL: options.origin,
      GITHUB_CLIENT_ID: "e2e-client",
      GITHUB_CLIENT_SECRET: "e2e-client-secret",
      GITHUB_USER_ID: OWNER_GITHUB_ID,
      GITHUB_USERNAME: "",
      DISABLE_SIGNUP: "true",
    },
  });

  const db = (await miniflare.getD1Database("DB")) as unknown as D1Database;
  await applyMigrations(db);
  if (options.dataset === "production") await seedSyntheticData(db, productionCounts());
  else await seedFixtureRows(db);
  await seedOwnerSession(db);
  return miniflare;
}

async function seedFixtureRows(db: D1Database) {
  await db.batch([
    db.prepare(
      "INSERT INTO players (id, name, normalized_name, sex, active, rapid, blitz, classic, birth_date) VALUES (?, ?, 'jogadora teste', 'female', 1, 1800, 1700, 1750, '2012-03-04')",
    ).bind(PLAYER.id, PLAYER.name),
    db.prepare(
      "INSERT INTO posts (id, title, slug, content, published) VALUES (1, ?, ?, 'Conteúdo da notícia.', 1)",
    ).bind(POST.title, POST.slug),
    db.prepare("INSERT INTO announcements (id, year, number, content) VALUES (1, 2026, 1, 'Comunicado de teste')"),
    // A second ratings page (20 per page) for pagination tests; rated below the fixture player.
    db.prepare(
      `INSERT INTO players (name, normalized_name, sex, active, rapid, blitz, classic)
       WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 25)
       SELECT 'Atleta Extra ' || i, 'atleta extra ' || i, 'male', 1, 1000 + i, 1000, 1000 FROM n`,
    ),
  ]);
}

async function seedOwnerSession(db: D1Database) {
  const now = Date.now();
  const farFuture = now + 365 * 24 * 60 * 60 * 1000;
  await db.batch([
    db.prepare(
      "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES ('owner-id', 'owner', 'owner@example.com', 1, ?, ?)",
    ).bind(now, now),
    db.prepare(
      "INSERT INTO account (id, account_id, provider_id, user_id, created_at, updated_at) VALUES ('owner-github', ?, 'github', 'owner-id', ?, ?)",
    ).bind(OWNER_GITHUB_ID, now, now),
    db.prepare(
      "INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at) VALUES ('owner-session', ?, 'owner-id', ?, ?, ?)",
    ).bind(OWNER_SESSION_TOKEN, farFuture, now, now),
  ]);
}
