import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { Miniflare } from "miniflare";

const migrationsDir = fileURLToPath(new NodeURL("../../db/src/migrations/", import.meta.url));
const migrationFiles = (await readdir(migrationsDir)).filter((name) => /^\d+_.*\.sql$/.test(name)).sort();
const LAST_APPLIED_IN_PRODUCTION_BEFORE_REBUILD = "0020";

const statementsOf = async (file: string) =>
  (await readFile(`${migrationsDir}${file}`, "utf8"))
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

// Alchemy sends each migration file to D1 as one request, which D1 runs as one
// transaction with foreign keys enforced (so `PRAGMA foreign_keys=OFF` is a no-op).
async function applyAsProduction(db: D1Database, files: string[]) {
  for (const file of files) {
    await db.batch((await statementsOf(file)).map((statement) => db.prepare(statement)));
  }
}

async function withD1<T>(name: string, run: (db: D1Database) => Promise<T>): Promise<T> {
  const miniflare = new Miniflare({
    compatibilityDate: "2026-07-30",
    d1Databases: { DB: name },
    modules: true,
    script: "export default { async fetch() { return new Response('ok') } }",
  });
  try {
    return await run(await miniflare.getD1Database("DB"));
  } finally {
    await miniflare.dispose();
  }
}

async function domainTables(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT IN ('d1_migrations', 'rate_limits') ORDER BY name")
    .all<{ name: string }>();
  return results.map((row) => row.name);
}

async function rowCounts(db: D1Database): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of await domainTables(db)) {
    counts[table] = (await db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).first<{ count: number }>())!.count;
  }
  return counts;
}

async function schemaOf(db: D1Database): Promise<Record<string, string>> {
  const { results } = await db
    .prepare("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT IN ('d1_migrations', 'rate_limits')")
    .all<{ type: string; name: string; sql: string }>();
  return Object.fromEntries(
    results.map((row) => [`${row.type}:${row.name}`, row.sql.replace(/[`"]/g, "").replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")")]),
  );
}

// One or more rows in every domain table, including values that sit on the
// edges of the final constraints, as production data does.
const PRODUCTION_SHAPED_ROWS = [
  "INSERT INTO championships (id, name) VALUES (1, 'Campeonato Sergipano Absoluto')",
  "INSERT INTO clubs (id, name) VALUES (1, 'Clube'), (2, 'Escola')",
  "INSERT INTO locations (id, name, type) VALUES (1, 'Aracaju', 'city')",
  "INSERT INTO players (id, name, normalized_name, rapid, sex, club_id, location_id, birth_date) VALUES (1, 'Ana', 'ana', 2100, 'female', 1, 1, '2008-05-01'), (2, 'Bruno', 'bruno', 1800, 'male', 2, NULL, NULL)",
  "INSERT INTO titles (id, name, short_name, type) VALUES (1, 'Mestre Sergipano', 'MSE', 'internal')",
  "INSERT INTO roles (id, name, short_name, type) VALUES (1, 'Presidente', 'PRES', 'management')",
  "INSERT INTO norms (id, name) VALUES (1, 'Norma de MSE')",
  "INSERT INTO insignias (id, name, level) VALUES (1, 'Campeão', 1)",
  "INSERT INTO players_to_titles (player_id, title_id) VALUES (1, 1)",
  "INSERT INTO players_to_roles (player_id, role_id) VALUES (1, 1)",
  "INSERT INTO players_to_norms (player_id, norm_id) VALUES (1, 1)",
  "INSERT INTO players_to_insignias (player_id, insignia_id) VALUES (1, 1)",
  "INSERT INTO tournaments (id, name, rating_type, championship_id, date) VALUES (1, 'Aberto', 'rapid', 1, '2026-05-01'), (2, 'Escolar', 'blitz', NULL, NULL)",
  "INSERT INTO players_to_tournaments (player_id, tournament_id, old_rating, variation, rating_type) VALUES (1, 1, 2090, 10, 'rapid'), (2, 2, 1800, -5, 'blitz')",
  "INSERT INTO tournament_podiums (player_id, tournament_id, place) VALUES (1, 1, 1)",
  "INSERT INTO defending_champions (player_id, championship_id) VALUES (1, 1)",
  "INSERT INTO circuits (id, name, type) VALUES (1, 'Circuito Escolar', 'categories'), (2, 'Circuito Geral', 'geral')",
  "INSERT INTO circuit_phases (id, circuit_id, tournament_id, club_id, sort_order) VALUES (1, 1, 2, 2, 0)",
  "INSERT INTO circuit_podiums (player_id, circuit_phase_id, category, place, points) VALUES (1, 1, 'Sub 18 Feminino', 1, 10)",
  "INSERT INTO circuit_podiums (player_id, circuit_id, place, points) VALUES (2, 2, 30, 2)",
  "INSERT INTO cups (id, name, image_url, start_date, end_date, prize_pool, rating_type, championship_id) VALUES (1, 'Copa', 'https://example.com/copa.png', '2026-01-01', '2026-02-01', 325, 'blitz', 1)",
  "INSERT INTO cup_groups (id, cup_id, name, sort_order) VALUES (1, 1, 'A', 0)",
  "INSERT INTO cup_players (player_id, cup_group_id, nickname, position) VALUES (1, 1, 'ana', 1)",
  "INSERT INTO cup_rounds (id, cup_group_id, sort_order) VALUES (1, 1, 0)",
  "INSERT INTO cup_brackets (id, cup_id, bracket_type) VALUES (1, 1, 'UB')",
  "INSERT INTO cup_playoffs (id, cup_bracket_id, phase_type, sort_order) VALUES (1, 1, 'Grande Final', 0)",
  "INSERT INTO cup_matches (id, player_one_id, player_two_id, winner_id, cup_round_id, best_of, sort_order, date) VALUES (1, 1, 2, 1, 1, 5, 0, '2026-01-02')",
  "INSERT INTO cup_matches (id, player_one_id, player_two_id, cup_playoff_id, best_of, sort_order, date) VALUES (2, 1, 2, 1, 11, 0, '2026-01-30')",
  "INSERT INTO cup_games (cup_match_id, game_number, winner_id) VALUES (1, 1, 1)",
  "INSERT INTO events (id, name, start_date) VALUES (1, 'Aberto de Aracaju', '2026-11-01')",
  "INSERT INTO link_groups (id, label, event_id) VALUES (1, 'Aberto de Aracaju', 1), (2, 'Úteis', NULL)",
  "INSERT INTO links (label, icon, type, sort_order, link_group_id) VALUES ('Regulamento', 'link', 'regulation', 0, 1), ('CBX', 'link', 'link', 0, 2)",
  "INSERT INTO posts (title, content, slug, published) VALUES ('Notícia', 'Texto', 'noticia', 1)",
  "INSERT INTO announcements (year, number, content, created_at, updated_at) VALUES (2026, 1, 'Comunicado', NULL, NULL)",
  "INSERT INTO tv_sergipe (club_id, player_id, age_group, sex, modality, place, points) VALUES (2, 2, '12', 'male', 'individual', 1, 10)",
  "INSERT INTO tv_sergipe (club_id, team_name, age_group, sex, modality, place, points) VALUES (2, 'A', '12', 'male', 'team', 2, 8)",
  "INSERT INTO user (id, name, email, updated_at) VALUES ('owner', 'owner', 'owner@example.com', 0)",
  "INSERT INTO account (id, account_id, provider_id, user_id, updated_at) VALUES ('owner-github', '1', 'github', 'owner', 0)",
  "INSERT INTO session (id, expires_at, token, updated_at, user_id) VALUES ('s1', 4102444800000, 'token', 0, 'owner')",
  "INSERT INTO verification (id, identifier, value, expires_at) VALUES ('v1', 'state', 'value', 4102444800000)",
  // Production created this table at runtime before migrations owned it.
  "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (key, window_start))",
  "INSERT INTO rate_limits (key, window_start, count) VALUES ('auth:1.2.3.4', 1, 3)",
];

describe("D1 migrations", () => {
  test("upgrading production from 0020 keeps every row and reaches the fresh schema", async () => {
    const before = migrationFiles.filter((file) => file.slice(0, 4) <= LAST_APPLIED_IN_PRODUCTION_BEFORE_REBUILD);
    const pending = migrationFiles.filter((file) => file.slice(0, 4) > LAST_APPLIED_IN_PRODUCTION_BEFORE_REBUILD);

    const fresh = await withD1("fsx-migrations-fresh", async (db) => {
      await applyAsProduction(db, migrationFiles);
      return schemaOf(db);
    });

    await withD1("fsx-migrations-upgrade", async (db) => {
      await applyAsProduction(db, before);
      for (const statement of PRODUCTION_SHAPED_ROWS) await db.prepare(statement).run();
      const countsBefore = await rowCounts(db);
      expect(Object.values(countsBefore).every((count) => count > 0)).toBe(true);

      await applyAsProduction(db, pending);

      const countsAfter = await rowCounts(db);
      const createdTables = Object.keys(countsAfter).filter((table) => !(table in countsBefore));
      expect(countsAfter).toEqual({ ...countsBefore, ...Object.fromEntries(createdTables.map((table) => [table, 0])) });
      expect(await schemaOf(db)).toEqual(fresh);
      expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
      expect(
        await db.prepare("SELECT created_at IS NOT NULL AS stamped FROM announcements").first<{ stamped: number }>(),
      ).toEqual({ stamped: 1 });
      expect(
        (await db.prepare("SELECT player_id, title_id FROM players_to_titles").all()).results,
      ).toEqual([{ player_id: 1, title_id: 1 }]);
      expect(
        (await db.prepare("SELECT id, tier FROM tournaments ORDER BY id").all()).results,
      ).toEqual([{ id: 1, tier: "S" }, { id: 2, tier: "B" }]);
      expect(
        (await db.prepare("SELECT player_id, place, category FROM tournament_podiums").all()).results,
      ).toEqual([{ player_id: 1, place: 1, category: null }]);
      expect(
        await db.prepare("SELECT COUNT(*) AS missing FROM circuits WHERE year IS NULL").first<{ missing: number }>(),
      ).toEqual({ missing: 0 });
      expect(await db.prepare("SELECT tier FROM titles WHERE id = 1").first<{ tier: number }>()).toEqual({ tier: 3 });
    });
  });

  test("no migration after the rebuild drops a table that other tables reference", async () => {
    const referenced = await withD1("fsx-migrations-references", async (db) => {
      await applyAsProduction(db, migrationFiles);
      const parents = new Set<string>();
      for (const table of await domainTables(db)) {
        const { results } = await db.prepare(`PRAGMA foreign_key_list("${table}")`).all<{ table: string }>();
        for (const fk of results) if (fk.table !== table) parents.add(fk.table);
      }
      return parents;
    });

    const offenders: string[] = [];
    for (const file of migrationFiles.filter((name) => name.slice(0, 4) > "0021")) {
      const sql = (await statementsOf(file)).join("\n");
      for (const [, table] of sql.matchAll(/DROP TABLE [`"]?(\w+)[`"]?/gi)) {
        if (!table!.startsWith("__") && referenced.has(table!)) offenders.push(`${file}: ${table}`);
      }
    }
    // Rebuilding a referenced table needs the backup → drop children-first →
    // recreate pattern of 0021; Drizzle's `PRAGMA foreign_keys=OFF` rebuild
    // cascade-deletes or fails on D1.
    expect(offenders).toEqual([]);
  });
});
