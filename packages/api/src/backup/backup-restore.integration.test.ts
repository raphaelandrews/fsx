import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Miniflare } from "miniflare";

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { ACCOUNT_TABLES, migrationRecorder, readBackup } from "./backup-restore";

let miniflare: Miniflare;
let db: D1Database;

beforeAll(async () => {
  miniflare = new Miniflare({
    compatibilityDate: "2026-07-30",
    d1Databases: { DB: "fsx-backup-restore" },
    modules: true,
    script: "export default { async fetch() { return new Response('ok') } }",
  });
  db = (await miniflare.getD1Database("DB")) as unknown as D1Database;
});

afterAll(async () => {
  await miniflare.dispose();
});

describe("migrationRecorder", () => {
  test("records into production's tracker: zero-padded text id and a required applied_at", async () => {
    await db.exec("DROP TABLE IF EXISTS d1_migrations");
    await db.exec("CREATE TABLE d1_migrations (id TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)");
    await db.prepare("INSERT INTO d1_migrations VALUES ('00027', '0026_x.sql', '2026-10-01 00:00:00')").run();
    const record = await migrationRecorder(db);
    await db.batch([record("0027_a.sql"), record("0028_b.sql")]);
    const rows = (await db.prepare("SELECT id, name FROM d1_migrations ORDER BY id").all()).results;
    expect(rows).toEqual([
      { id: "00027", name: "0026_x.sql" },
      { id: "00028", name: "0027_a.sql" },
      { id: "00029", name: "0028_b.sql" },
    ]);
  });

  test("records into local Alchemy's tracker: integer id and a required type", async () => {
    await db.exec("DROP TABLE IF EXISTS d1_migrations");
    await db.exec(
      "CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, applied_at TEXT DEFAULT CURRENT_TIMESTAMP, type TEXT NOT NULL)",
    );
    const record = await migrationRecorder(db);
    await record("0027_a.sql").run();
    expect(await db.prepare("SELECT name, type FROM d1_migrations").first<{ name: string; type: string }>()).toEqual({
      name: "0027_a.sql",
      type: "migration",
    });
  });

  test("refuses a tracker with a required column it does not know", async () => {
    await db.exec("DROP TABLE IF EXISTS d1_migrations");
    await db.exec("CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL)");
    await expect(migrationRecorder(db)).rejects.toThrow("checksum");
  });
});

describe("readBackup", () => {
  test("keeps a table's schema but drops its rows when asked", async () => {
    const dir = mkdtempSync(`${tmpdir()}/fsx-backup-test-`);
    try {
      const file = `${dir}/dump.sql`;
      writeFileSync(
        file,
        `CREATE TABLE "user" (id TEXT PRIMARY KEY);
CREATE TABLE clubs (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO "user" VALUES ('secret');
INSERT INTO clubs VALUES (1, 'Clube');
CREATE INDEX clubs_name_idx ON clubs (name);`,
      );
      const { statements, expectedRows } = await readBackup(file, { excludeRows: ACCOUNT_TABLES });
      expect(statements.some((statement) => statement.includes("secret"))).toBe(false);
      expect(statements.filter((statement) => /^CREATE/i.test(statement))).toHaveLength(3);
      expect([...expectedRows]).toEqual([["clubs", 1]]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
