import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, URL as NodeURL } from "node:url";

import type { Miniflare } from "miniflare";

import { createTestD1 } from "./test-d1";

const auditsDir = fileURLToPath(new NodeURL("../../db/src/audits/", import.meta.url));
const auditFiles = (await readdir(auditsDir)).filter((name) => name.endsWith(".sql")).sort();

// Audits are pasted into `wrangler d1 execute --command`, which runs on D1's
// SQLite limits (for example, at most 5 terms per compound SELECT).
function statementsOf(sql: string): string[] {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

let miniflare: Miniflare;
let db: D1Database;

beforeAll(async () => {
  const d1 = await createTestD1("fsx-audits");
  miniflare = d1.miniflare;
  db = d1.binding;
});

afterAll(async () => {
  await miniflare.dispose();
});

describe("database audits", () => {
  test("every audit file has statements", () => {
    expect(auditFiles.length).toBeGreaterThan(0);
  });

  test("pre-migration checks report nothing on a database that satisfies the constraints", async () => {
    const [statement] = statementsOf(await readFile(`${auditsDir}pre-migration-data-checks.sql`, "utf8"));
    expect((await db.prepare(statement!).all()).results).toEqual([]);
  });

  test("timestamp-format flags non-canonical timestamps per table", async () => {
    await db
      .prepare("INSERT INTO clubs (name, created_at, updated_at) VALUES ('Audit Club', '2026-10-02T10:00:00Z', '2026-10-02 10:00:00')")
      .run();
    const [statement] = statementsOf(await readFile(`${auditsDir}timestamp-format.sql`, "utf8"));
    expect((await db.prepare(statement!).all()).results).toEqual([{ table_name: "clubs", noncanonical_timestamps: 1 }]);
  });

  for (const file of auditFiles) {
    test(`${file} runs on D1 against the current schema`, async () => {
      const statements = statementsOf(await readFile(`${auditsDir}${file}`, "utf8"));
      expect(statements.length).toBeGreaterThan(0);
      for (const statement of statements) {
        await db.prepare(statement).all();
      }
    });
  }
});
