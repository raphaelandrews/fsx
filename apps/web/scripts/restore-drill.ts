// Restore drill: loads a D1 backup dump (from `bun run db:backup`) into a fresh
// Miniflare D1, applies any repository migrations the backup predates (as a real
// recovery deploy would), then runs the built app against it and checks that row
// counts survived and public pages render real records. Prints counts only.
//   bun run build && bun apps/web/scripts/restore-drill.ts ~/Backups/fsx-<stamp>/fsx-<stamp>.sql
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { splitSqlStatements } from "./sql-dump";
import { startWorker } from "./worker-harness";

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("Usage: bun apps/web/scripts/restore-drill.ts <backup.sql>");
  process.exit(2);
}

const migrationsDir = fileURLToPath(new URL("../../../packages/db/src/migrations/", import.meta.url));

const SKIPPED = /^(PRAGMA|BEGIN|COMMIT|ROLLBACK)\b|sqlite_sequence|\b_cf_\w+/i;
const dump = splitSqlStatements(await readFile(backupPath, "utf8")).filter((statement) => !SKIPPED.test(statement));

const tableOf = (statement: string, verb: RegExp) => statement.match(verb)?.[1];
const creates = dump.filter((statement) => /^CREATE TABLE/i.test(statement));
const inserts = dump.filter((statement) => /^INSERT INTO/i.test(statement));
const others = dump.filter((statement) => !creates.includes(statement) && !inserts.includes(statement));

// D1 rejects PRAGMA foreign_keys=OFF, so parents must be restored before children.
const references = new Map<string, Set<string>>();
for (const create of creates) {
  const table = tableOf(create, /^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["`]?(\w+)["`]?/i)!;
  const parents = [...create.matchAll(/REFERENCES\s+["`]?(\w+)["`]?/gi)].map((match) => match[1]!);
  references.set(table, new Set(parents.filter((parent) => parent !== table)));
}
const ordered: string[] = [];
const visit = (table: string, path: Set<string> = new Set()) => {
  if (ordered.includes(table) || path.has(table)) return;
  path.add(table);
  for (const parent of references.get(table) ?? []) visit(parent, path);
  ordered.push(table);
};
for (const table of references.keys()) visit(table);
const insertTable = (statement: string) => tableOf(statement, /^INSERT INTO\s+["`]?(\w+)["`]?/i)!;
const statements = [
  ...creates,
  ...[...inserts].sort((a, b) => ordered.indexOf(insertTable(a)) - ordered.indexOf(insertTable(b))),
  ...others,
];

const expectedRows = new Map<string, number>();
for (const statement of inserts) {
  const table = insertTable(statement);
  expectedRows.set(table, (expectedRows.get(table) ?? 0) + 1);
}

const migrationFiles = (await readdir(migrationsDir)).filter((name) => /^\d+_.*\.sql$/.test(name)).sort();
const failures: string[] = [];
const appliedAfterRestore: string[] = [];
let sample: { playerId?: number; postSlug?: string } = {};

const miniflare = await startWorker({
  origin: "http://localhost",
  restore: async (db) => {
    const started = performance.now();
    for (let index = 0; index < statements.length; index += 200) {
      await db.batch(statements.slice(index, index + 200).map((statement) => db.prepare(statement)));
    }
    console.info(`Restored ${statements.length} statements in ${Math.round(performance.now() - started)} ms.`);

    const applied = new Set(
      (await db.prepare("SELECT name FROM d1_migrations").all<{ name: string }>()).results.map((row) => row.name),
    );
    if (applied.size === 0) failures.push("backup has no d1_migrations rows; it cannot be resumed by the migration tracker");
    for (const file of migrationFiles.filter((name) => !applied.has(name))) {
      const sql = await readFile(`${migrationsDir}${file}`, "utf8");
      for (const statement of sql.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) {
        await db.prepare(statement).run();
      }
      await db.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind(file).run();
      appliedAfterRestore.push(file);
    }

    for (const [table, expected] of expectedRows) {
      const row = await db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).first<{ count: number }>();
      if (row?.count !== expected) failures.push(`${table}: ${row?.count} rows restored, ${expected} in the backup`);
    }

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

const tables = [...expectedRows.entries()].map(([table, count]) => `${table}=${count}`).join(", ");
console.info(`Backup rows: ${tables || "none"}`);
if (appliedAfterRestore.length) console.info(`Migrations applied after restore: ${appliedAfterRestore.join(", ")}`);
if (failures.length) {
  console.error(`Restore drill FAILED:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
  process.exit(1);
}
console.info(`Restore drill passed on ${new Date().toISOString().slice(0, 10)}.`);
