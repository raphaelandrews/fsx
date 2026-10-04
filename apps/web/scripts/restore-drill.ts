// Restore drill: loads a D1 backup dump (from `bun run db:backup`) into a fresh
// Miniflare D1, applies any repository migrations the backup predates (as a real
// recovery deploy would), then runs the built app against it and checks that row
// counts survived and public pages render real records. Prints counts only.
//   bun run build && bun apps/web/scripts/restore-drill.ts ~/Backups/fsx-<stamp>/fsx-<stamp>.sql
import { readBackup, restoreBackup } from "@fsx/api/backup-restore";
import { startWorker } from "./worker-harness";

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("Usage: bun apps/web/scripts/restore-drill.ts <backup.sql>");
  process.exit(2);
}

const backup = await readBackup(backupPath);
const failures: string[] = [];
let appliedAfterRestore: string[] = [];
let sample: { playerId?: number; postSlug?: string } = {};

const miniflare = await startWorker({
  origin: "http://localhost",
  restore: async (db) => {
    const restored = await restoreBackup(db, backup);
    appliedAfterRestore = restored.appliedAfterRestore;
    failures.push(...restored.failures);

    sample = {
      playerId: (await db.prepare("SELECT id FROM players WHERE active = 1 ORDER BY id LIMIT 1").first<{ id: number }>())?.id,
      postSlug: (await db.prepare("SELECT slug FROM posts WHERE published = 1 ORDER BY id LIMIT 1").first<{ slug: string }>())
        ?.slug,
    };
  },
});

try {
  const paths = ["/", "/ratings", "/noticias", "/comunicados", "/titulados", "/sitemap.xml"];
  if (sample.playerId) paths.push(`/jogadores/${sample.playerId}`);
  if (sample.postSlug) paths.push(`/noticias/${encodeURIComponent(sample.postSlug)}`);
  for (const path of paths) {
    const response = await miniflare.dispatchFetch(`http://localhost${path}`);
    await response.arrayBuffer();
    if (response.status !== 200) failures.push(`${path} returned ${response.status} on restored data`);
  }
  console.info(`Checked ${paths.length} routes against restored data.`);
} finally {
  await miniflare.dispose();
}

const tables = [...backup.expectedRows.entries()].map(([table, count]) => `${table}=${count}`).join(", ");
console.info(`Backup rows: ${tables || "none"}`);
if (appliedAfterRestore.length) console.info(`Migrations applied after restore: ${appliedAfterRestore.join(", ")}`);
if (failures.length) {
  console.error(`Restore drill FAILED:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
  process.exit(1);
}
console.info(`Restore drill passed on ${new Date().toISOString().slice(0, 10)}.`);
