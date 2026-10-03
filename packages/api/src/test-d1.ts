import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { Miniflare } from "miniflare";

const migrationsDirectory = new NodeURL("../../db/src/migrations/", import.meta.url);

export async function applyMigrations(database: D1Database) {
  const directoryPath = fileURLToPath(migrationsDirectory);
  const files = (await readdir(directoryPath))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();

  for (const file of files) {
    const migration = await readFile(new NodeURL(file, migrationsDirectory), "utf8");
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);
    // One transaction per file, as Alchemy applies migrations to D1.
    await database.batch(statements.map((statement) => database.prepare(statement)));
  }
}

export async function createTestD1(
  name: string,
): Promise<{ miniflare: Miniflare; binding: D1Database; images: R2Bucket }> {
  const miniflare = new Miniflare({
    compatibilityDate: "2026-07-30",
    d1Databases: { DB: name },
    r2Buckets: { IMAGES: `${name}-images` },
    modules: true,
    script: "export default { async fetch() { return new Response('ok') } }",
  });
  const binding = await miniflare.getD1Database("DB");
  await applyMigrations(binding);
  const images = (await miniflare.getR2Bucket("IMAGES")) as unknown as R2Bucket;
  return { miniflare, binding, images };
}
