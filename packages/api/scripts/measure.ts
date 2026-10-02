// Seeds production-sized synthetic data (or the counts in a JSON file passed as
// the first argument) into a local D1 and reports, per representative procedure:
// D1 statements, rows read, response size, duration, and full-table scans.
//   bun packages/api/scripts/measure.ts [counts.json] [--json]
import { readFileSync } from "node:fs";

import { plugin } from "bun";

import { testEnv, TEST_OWNER_GITHUB_ID } from "../src/test-env";

plugin({
  name: "cloudflare-workers-env",
  setup(build) {
    build.module("cloudflare:workers", () => ({
      exports: { env: testEnv, waitUntil: (promise: Promise<unknown>) => void promise },
      loader: "object",
    }));
  },
});

const { createDb } = await import("@fsx/db");
const { meterD1 } = await import("../src/d1-meter");
const { appRouter } = await import("../src/routers/index");
const { getSitemapEntries } = await import("../src/sitemap");
const { createTestD1 } = await import("../src/test-d1");
const { DEFAULT_SYNTHETIC_COUNTS, seedSyntheticData } = await import("../src/synthetic-data");
const { insertGithubUser } = await import("../src/test-admin");

type Caller = ReturnType<typeof appRouter.createCaller>;

const countsPath = process.argv.slice(2).find((arg: string) => !arg.startsWith("--"));
const counts = {
  ...DEFAULT_SYNTHETIC_COUNTS,
  ...(countsPath ? JSON.parse(readFileSync(countsPath, "utf8")) : {}),
};
const asJson = process.argv.includes("--json");
const lastPostPage = Math.max(1, Math.ceil((counts.posts * 0.9) / 9));

const scenarios: Array<{ name: string; admin?: boolean; run: (caller: Caller) => Promise<unknown> }> = [
  { name: "topPlayers.list", run: (c) => c.topPlayers.list() },
  { name: "events.list", run: (c) => c.events.list() },
  { name: "posts.fresh", run: (c) => c.posts.fresh() },
  { name: "announcements.fresh", run: (c) => c.announcements.fresh() },
  { name: "players.withFilters (default)", run: (c) => c.players.withFilters({}) },
  { name: "players.withFilters (page 50)", run: (c) => c.players.withFilters({ page: 50 }) },
  {
    name: "players.withFilters (filters)",
    run: (c) => c.players.withFilters({ groups: ["sub-14", "master"], clubs: ["Clube 3"], sex: "female", sortBy: "blitz" }),
  },
  { name: "players.withFilters (name)", run: (c) => c.players.withFilters({ name: "sintetico 12" }) },
  { name: "players.search (empty)", run: (c) => c.players.search({ query: "" }) },
  { name: "players.search (words)", run: (c) => c.players.search({ query: "jogador 77" }) },
  { name: "players.byId", run: (c) => c.players.byId({ id: 1 }) },
  { name: "titledPlayers.list", run: (c) => c.titledPlayers.list() },
  { name: "roles.listWithPlayers", run: (c) => c.roles.listWithPlayers() },
  { name: "champions.gallery", run: (c) => c.champions.gallery() },
  { name: "circuits.listSimple", run: (c) => c.circuits.listSimple() },
  { name: "circuits.byId", run: (c) => c.circuits.byId({ id: 1 }) },
  { name: "posts.byPage (1)", run: (c) => c.posts.byPage({ page: 1 }) },
  { name: `posts.byPage (${lastPostPage})`, run: (c) => c.posts.byPage({ page: lastPostPage }) },
  { name: "posts.bySlug", run: (c) => c.posts.bySlug({ slug: "noticia-sintetica-1" }) },
  { name: "announcements.byPage (1)", run: (c) => c.announcements.byPage({ page: 1 }) },
  { name: "tvSergipe.list", run: (c) => c.tvSergipe.list() },
  { name: "tvSergipe.leaderboard", run: (c) => c.tvSergipe.leaderboard() },
  { name: "links.list", run: (c) => c.links.list() },
  { name: "clubs.list", run: (c) => c.clubs.list() },
  { name: "locations.list", run: (c) => c.locations.list() },
  { name: "sitemap entries (server-only)", run: (c) => getSitemapEntries((c as unknown as { db: never }).db) },
  { name: "players.page (admin)", admin: true, run: (c) => c.players.page({}) },
  { name: "posts.listAdmin (admin)", admin: true, run: (c) => c.posts.listAdmin() },
  { name: "tournaments.list (admin page)", admin: true, run: (c) => c.tournaments.list() },
  { name: "swissManager.list (admin export)", admin: true, run: (c) => c.swissManager.list() },
];

// Procedures each public route loader prefetches during SSR (anonymous views
// make no other D1 calls: without a session cookie getSession skips the DB).
const ssrRoutes: Record<string, string[]> = {
  "/": ["topPlayers.list", "events.list", "posts.fresh", "announcements.fresh"],
  "/ratings": ["players.withFilters (default)", "clubs.list", "locations.list"],
  "/noticias": ["posts.byPage (1)"],
  "/noticias/$slug": ["posts.bySlug"],
  "/jogadores/$id": ["players.byId"],
  "/comunicados": ["announcements.byPage (1)"],
  "/titulados": ["titledPlayers.list"],
  "/membros": ["roles.listWithPlayers"],
  "/circuitos": ["circuits.listSimple", "circuits.byId"],
  "/tv-sergipe": ["tvSergipe.list", "tvSergipe.leaderboard"],
  "/campeoes": ["champions.gallery"],
};

const { miniflare, binding } = await createTestD1("measure");
const rows: Array<Record<string, string | number>> = [];

try {
  const startedSeed = performance.now();
  await seedSyntheticData(binding, counts);
  const seedDb = createDb(binding);
  await insertGithubUser(seedDb, "owner-id", "owner", TEST_OWNER_GITHUB_ID);
  if (!asJson) console.log(`Seeded synthetic data in ${Math.round(performance.now() - startedSeed)} ms\n`);
  const tables = new Set(
    (await binding.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>()).results.map(
      (table) => table.name,
    ),
  );

  for (const scenario of scenarios) {
    const meter = meterD1(binding, { record: true });
    const db = createDb(meter.binding);
    const caller = appRouter.createCaller({
      db,
      d1: meter,
      session: scenario.admin ? ({ user: { id: "owner-id", name: "owner" } } as never) : null,
      requestId: "measure",
    });
    const run = scenario.name.startsWith("sitemap")
      ? () => getSitemapEntries(db)
      : () => scenario.run(caller);

    const startedAt = performance.now();
    const result = await run();
    const durationMs = performance.now() - startedAt;

    let rowsRead = 0;
    const scans = new Set<string>();
    for (const statement of meter.statements) {
      if (!/^\s*select/i.test(statement.sql)) continue;
      const replay = await binding.prepare(statement.sql).bind(...statement.params).all();
      rowsRead += replay.meta.rows_read ?? 0;
      const plan = await binding.prepare(`EXPLAIN QUERY PLAN ${statement.sql}`).bind(...statement.params).all<{ detail: string }>();
      for (const step of plan.results) {
        const scanned = step.detail.startsWith("SCAN ") ? step.detail.split(" ")[1] : undefined;
        if (scanned && tables.has(scanned) && !/USING (COVERING )?INDEX/.test(step.detail)) scans.add(scanned);
      }
    }

    rows.push({
      procedure: scenario.name,
      d1Queries: meter.queries,
      rowsRead,
      responseKB: Number((new TextEncoder().encode(JSON.stringify(result ?? null)).byteLength / 1024).toFixed(1)),
      durationMs: Math.round(durationMs),
      fullScans: [...scans].join("; "),
    });
  }
} finally {
  await miniflare.dispose();
}

const routeRows = Object.entries(ssrRoutes).map(([route, procedures]) => {
  const parts = procedures.map((name) => rows.find((row) => row.procedure === name)!);
  return {
    route,
    d1Queries: parts.reduce((sum, row) => sum + Number(row.d1Queries), 0),
    rowsRead: parts.reduce((sum, row) => sum + Number(row.rowsRead), 0),
    dataKB: Number(parts.reduce((sum, row) => sum + Number(row.responseKB), 0).toFixed(1)),
  };
});

if (asJson) {
  console.log(JSON.stringify({ counts, results: rows, ssrRoutes: routeRows }, null, 2));
} else {
  console.table(rows);
  console.log("\nAnonymous SSR page views (sum of loader procedures):");
  console.table(routeRows);
}
