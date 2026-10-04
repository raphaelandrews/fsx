// Player level distribution on real data: restores a D1 backup into a local
// Miniflare D1 and computes every player's level with the same code as the
// profile (players.stats), to tune the XP weights before release. Prints
// aggregates only, never names.
//   bun run db:backup && bun packages/api/scripts/xp-distribution.ts ~/Backups/fsx-<stamp>/fsx-<stamp>.sql
import { Miniflare } from "miniflare";

import { createDb } from "@fsx/db";

import { readBackup, restoreBackup } from "../src/backup-restore";
import { loadPlayerStats } from "../src/gamification/load";

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("Usage: bun packages/api/scripts/xp-distribution.ts <backup.sql>");
  process.exit(2);
}

const miniflare = new Miniflare({
  compatibilityDate: "2026-07-30",
  d1Databases: { DB: "xp-distribution" },
  modules: true,
  script: "export default { async fetch() { return new Response('ok') } }",
});

try {
  const d1 = await miniflare.getD1Database("DB");
  const { failures } = await restoreBackup(d1, await readBackup(backupPath));
  if (failures.length) throw new Error(`Restore failed:\n${failures.join("\n")}`);

  const db = createDb(d1);
  const players = (await d1.prepare("SELECT id, active FROM players ORDER BY id").all<{ id: number; active: number }>()).results;
  const levels: { level: number; xp: number; active: boolean; breakdown: Record<string, number> }[] = [];
  for (const player of players) {
    const result = await loadPlayerStats(db, player.id);
    if (result) levels.push({ ...result.level, active: player.active === 1 });
  }

  const histogram = (rows: typeof levels) => {
    const counts = new Map<number, number>();
    for (const row of rows) counts.set(row.level, (counts.get(row.level) ?? 0) + 1);
    return [...counts].sort(([a], [b]) => a - b);
  };
  const percentile = (values: number[], p: number) => values[Math.min(values.length - 1, Math.floor((values.length * p) / 100))];

  for (const [label, rows] of [["All players", levels], ["Active players", levels.filter((row) => row.active)]] as const) {
    const xp = rows.map((row) => row.xp).sort((a, b) => a - b);
    console.info(`\n${label}: ${rows.length}`);
    console.info(`XP p50 ${percentile(xp, 50)} · p90 ${percentile(xp, 90)} · p99 ${percentile(xp, 99)} · max ${xp.at(-1)}`);
    for (const [level, count] of histogram(rows)) {
      console.info(`  level ${String(level).padStart(2)}: ${String(count).padStart(5)} ${"█".repeat(Math.ceil((count / rows.length) * 60))}`);
    }
  }

  const top = [...levels].sort((a, b) => b.xp - a.xp).slice(0, 10);
  console.info("\nTop 10 by XP (breakdown, no names):");
  for (const row of top) {
    console.info(`  level ${row.level} · ${row.xp} XP · ${Object.entries(row.breakdown).map(([source, value]) => `${source} ${value}`).join(", ")}`);
  }
} finally {
  await miniflare.dispose();
}
