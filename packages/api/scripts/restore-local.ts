// Replaces the local dev D1 (the one `bun dev` reads) with a production backup, so
// the app can be checked against real data. Stop `bun dev` first.
//   bun run db:restore-local ~/Backups/fsx-<stamp>/fsx-<stamp>.sql
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { Miniflare } from "miniflare";

import { readBackup, restoreBackup } from "../src/backup-restore";

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("Usage: bun run db:restore-local <backup.sql>");
  process.exit(2);
}

// Deleting the D1 files under a running `alchemy dev` leaves it serving a database
// that no longer exists on disk.
const running = spawnSync("pgrep", ["-f", "alchemy.run.ts"], { encoding: "utf8" }).stdout.trim();
if (running) {
  console.error("Stop `bun dev` first (an alchemy.run.ts process is still running).");
  process.exit(1);
}

const repoRoot = fileURLToPath(new NodeURL("../../../", import.meta.url));
const wranglerConfig = readFileSync(`${repoRoot}apps/web/.alchemy/local/wrangler.jsonc`, "utf8");
const databaseId = wranglerConfig.match(/"binding":\s*"DB"[\s\S]*?"database_id":\s*"([^"]+)"/)?.[1];
if (!databaseId) {
  console.error('No local D1 binding "DB" found. Run `bun dev` once to generate the local config.');
  process.exit(1);
}

const persistRoot = `${repoRoot}.alchemy/miniflare/v3`;
rmSync(`${persistRoot}/d1`, { recursive: true, force: true });

const miniflare = new Miniflare({
  script: "",
  modules: true,
  defaultPersistRoot: persistRoot,
  d1Persist: true,
  d1Databases: { DB: databaseId },
});

try {
  const d1 = await miniflare.getD1Database("DB");
  const backup = await readBackup(backupPath);
  const { appliedAfterRestore, failures } = await restoreBackup(d1, backup);
  if (failures.length) throw new Error(`Restore failed:\n${failures.join("\n")}`);

  // Production's tracker has a required `applied_at` with no default, but Alchemy's
  // local migrator inserts only (name, type), so the next new migration would fail.
  // Rebuild it in the shape Alchemy creates locally (a leaf table, safe to rebuild).
  await d1.batch([
    d1.prepare(`CREATE TABLE d1_migrations_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      type TEXT NOT NULL
    )`),
    d1.prepare(
      "INSERT INTO d1_migrations_local (name, applied_at, type) SELECT name, applied_at, 'migration' FROM d1_migrations ORDER BY applied_at, id",
    ),
    d1.prepare("DROP TABLE d1_migrations"),
    d1.prepare("ALTER TABLE d1_migrations_local RENAME TO d1_migrations"),
    // Records and club standings computed by production code; recompute them locally.
    d1.prepare("DELETE FROM computed_results"),
  ]);

  const counts = ["players", "tournaments", "players_to_tournaments", "tournament_podiums", "posts", "announcements"]
    .map((table) => `${table}=${backup.expectedRows.get(table) ?? 0}`)
    .join(", ");
  console.info(`Restored ${counts}.`);
  if (appliedAfterRestore.length) console.info(`Applied newer migrations: ${appliedAfterRestore.join(", ")}`);
  console.info("Done. Start `bun dev`; do not run `bun run db:seed` on top of this data.");
} finally {
  await miniflare.dispose();
}
