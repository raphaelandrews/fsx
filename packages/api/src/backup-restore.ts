// Loads a D1 backup dump (from `bun run db:backup`) into an empty D1 and applies
// the repository migrations the backup predates, as a real recovery deploy
// would. Shared by the restore drill and offline analyses of production data.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { splitSqlStatements } from "./sql-dump";

const migrationsDir = fileURLToPath(new NodeURL("../../db/src/migrations/", import.meta.url));

const SKIPPED = /^(PRAGMA|BEGIN|COMMIT|ROLLBACK)\b|sqlite_sequence|\b_cf_\w+/i;

const tableOf = (statement: string, verb: RegExp) => statement.match(verb)?.[1];
const insertTable = (statement: string) => tableOf(statement, /^INSERT INTO\s+["`]?(\w+)["`]?/i)!;

export async function readBackup(backupPath: string) {
  const dump = splitSqlStatements(await readFile(backupPath, "utf8")).filter((statement) => !SKIPPED.test(statement));
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

  const expectedRows = new Map<string, number>();
  for (const statement of inserts) {
    const table = insertTable(statement);
    expectedRows.set(table, (expectedRows.get(table) ?? 0) + 1);
  }
  return {
    statements: [
      ...creates,
      ...[...inserts].sort((a, b) => ordered.indexOf(insertTable(a)) - ordered.indexOf(insertTable(b))),
      ...others,
    ],
    expectedRows,
  };
}

// Returns the migrations applied on top of the backup and any restore failures.
export async function restoreBackup(db: D1Database, backup: Awaited<ReturnType<typeof readBackup>>) {
  const failures: string[] = [];
  const started = performance.now();
  for (let index = 0; index < backup.statements.length; index += 200) {
    await db.batch(backup.statements.slice(index, index + 200).map((statement) => db.prepare(statement)));
  }
  console.info(`Restored ${backup.statements.length} statements in ${Math.round(performance.now() - started)} ms.`);

  const applied = new Set(
    (await db.prepare("SELECT name FROM d1_migrations").all<{ name: string }>()).results.map((row) => row.name),
  );
  if (applied.size === 0) failures.push("backup has no d1_migrations rows; it cannot be resumed by the migration tracker");
  const migrationFiles = (await readdir(migrationsDir)).filter((name) => /^\d+_.*\.sql$/.test(name)).sort();
  const recordMigration = await migrationRecorder(db);
  const appliedAfterRestore: string[] = [];
  for (const file of migrationFiles.filter((name) => !applied.has(name))) {
    const sql = await readFile(`${migrationsDir}${file}`, "utf8");
    // One transaction per file with foreign keys enforced, as Alchemy applies it to D1.
    await db.batch([
      ...sql.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean).map((statement) => db.prepare(statement)),
      recordMigration(file),
    ]);
    appliedAfterRestore.push(file);
  }

  for (const [table, backedUp] of backup.expectedRows) {
    const expected = table === "d1_migrations" ? backedUp + appliedAfterRestore.length : backedUp;
    const row = await db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).first<{ count: number }>();
    if (row?.count !== expected) failures.push(`${table}: ${row?.count} rows restored, ${expected} in the backup`);
  }
  return { appliedAfterRestore, failures };
}

type TrackerColumn = { name: string; type: string; notnull: number; dflt_value: string | null; pk: number };

// The migration tracker's shape differs between environments: production has a
// zero-padded text id and a required applied_at, local Alchemy an integer id
// and a required type. Build the insert from the columns the backup really has.
export async function migrationRecorder(db: D1Database) {
  const columns = (await db.prepare("PRAGMA table_info(d1_migrations)").all<TrackerColumn>()).results;
  // A non-integer primary key needs a value even when it is nullable (SQLite allows
  // NULL in a TEXT PRIMARY KEY); an integer one is assigned by SQLite.
  const integerKey = (column: TrackerColumn) => column.pk > 0 && /int/i.test(column.type);
  const required = columns.filter(
    (column) =>
      column.name !== "name" &&
      !integerKey(column) &&
      (column.pk > 0 || (column.notnull === 1 && column.dflt_value === null)),
  );
  const unknown = required.filter((column) => !["id", "applied_at", "type"].includes(column.name));
  if (unknown.length) throw new Error(`d1_migrations has unknown required columns: ${unknown.map((c) => c.name).join(", ")}`);

  const idColumn = required.find((column) => column.name === "id");
  let nextId = 0;
  let idWidth = 0;
  if (idColumn) {
    const ids = (await db.prepare("SELECT id FROM d1_migrations").all<{ id: string }>()).results.map((row) => String(row.id));
    nextId = Math.max(0, ...ids.map(Number).filter(Number.isFinite));
    idWidth = Math.max(0, ...ids.map((id) => id.length));
  }
  const names = ["name", ...required.map((column) => column.name)];
  const sql = `INSERT INTO d1_migrations (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`;
  return (file: string) =>
    db.prepare(sql).bind(
      ...names.map((name) => {
        if (name === "name") return file;
        if (name === "id") return String(++nextId).padStart(idWidth, "0");
        if (name === "applied_at") return new Date().toISOString().replace("T", " ").slice(0, 19);
        return "migration";
      }),
    );
}
