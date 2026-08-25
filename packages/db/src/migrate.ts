import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { config } from "dotenv"
import { Miniflare } from "miniflare"
import postgres from "postgres"

const scriptDir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(scriptDir, "../.env") })

const LOCAL = process.argv.includes("--local")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
	console.error(
		"DATABASE_URL is required. Add it to packages/db/.env:\n" +
			'  DATABASE_URL="postgresql://..."\n' +
			"Then run `bun run db:migrate`.",
	)
	process.exit(1)
}

const sql = postgres(DATABASE_URL, { prepare: false, max: 1 })

function lit(v: unknown): string {
	if (v === null || v === undefined) return "NULL"
	if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL"
	if (typeof v === "bigint") return String(v)
	if (typeof v === "boolean") return v ? "1" : "0"
	if (v instanceof Date) return `'${v.toISOString()}'`
	return `'${String(v).replace(/'/g, "''")}'`
}

function boolToInt(v: unknown): number {
	return v === true || v === 1 || v === "t" || v === "true" ? 1 : 0
}

function fmtDate(v: unknown): string | null {
	if (v === null || v === undefined) return null
	if (v instanceof Date) return v.toISOString().slice(0, 10)
	const s = String(v)
	return s.length >= 10 ? s.slice(0, 10) : s
}

function fmtTimestamp(v: unknown): string | null {
	if (v === null || v === undefined) return null
	if (v instanceof Date) return v.toISOString()
	return String(v)
}

function toInt(v: unknown): number | null {
	if (v === null || v === undefined) return null
	if (typeof v === "number") return v
	const n = Number.parseInt(String(v), 10)
	return Number.isNaN(n) ? null : n
}

type Spec = {
	table: string
	columns: string[]
	map: (r: Record<string, unknown>) => unknown[]
}

// Import order from DB.md — parents before children.
const specs: Spec[] = [
	{
		table: "locations",
		columns: ["id", "name", "type", "flag_url"],
		map: (r) => [r.id, r.name, r.type, r.flag],
	},
	{
		table: "clubs",
		columns: ["id", "name", "logo_url"],
		map: (r) => [r.id, r.name, r.logo],
	},
	{
		table: "championships",
		columns: ["id", "name"],
		map: (r) => [r.id, r.name],
	},
	{
		table: "players",
		columns: [
			"id",
			"name",
			"nickname",
			"blitz",
			"rapid",
			"classic",
			"active",
			"description",
			"image_url",
			"cbx_id",
			"fide_id",
			"verified",
			"birth_date",
			"sex",
			"club_id",
			"location_id",
			"created_at",
			"updated_at",
		],
		map: (r) => [
			r.id,
			r.name,
			r.nickname,
			r.blitz,
			r.rapid,
			r.classic,
			boolToInt(r.active),
			r.description,
			r.image_url,
			r.cbx_id,
			r.fide_id,
			boolToInt(r.verified),
			fmtDate(r.birth),
			r.sex === true ? "female" : "male",
			r.club_id,
			r.location_id,
			fmtTimestamp(r.created_at),
			fmtTimestamp(r.updated_at),
		],
	},
	{
		table: "roles",
		columns: ["id", "name", "short_name", "type"],
		map: (r) => [r.id, r.role, r.short_role, r.type],
	},
	{
		table: "titles",
		columns: ["id", "name", "short_name", "type"],
		map: (r) => [r.id, r.title, r.short_title, r.type],
	},
	{
		table: "norms",
		columns: ["id", "name"],
		map: (r) => [r.id, r.norm],
	},
	{
		table: "insignias",
		columns: ["id", "name", "level"],
		map: (r) => [r.id, r.insignia, r.level],
	},
	{
		table: "link_groups",
		columns: ["id", "label"],
		map: (r) => [r.id, r.label],
	},
	{
		table: "links",
		columns: ["id", "href", "label", "icon", "sort_order", "link_group_id"],
		map: (r) => [r.id, r.href, r.label, r.icon, r.order, r.link_group_id],
	},
	{
		table: "events",
		columns: [
			"id",
			"name",
			"chess_results",
			"start_date",
			"end_date",
			"regulation",
			"form",
			"type",
			"time_control",
		],
		map: (r) => [
			r.id,
			r.name,
			r.chess_results,
			fmtTimestamp(r.start_date),
			fmtTimestamp(r.end_date),
			r.regulation,
			r.form,
			r.type,
			r.time_control,
		],
	},
	{
		table: "tournaments",
		columns: ["id", "name", "chess_results", "date", "rating_type", "championship_id"],
		map: (r) => [
			r.id,
			r.name,
			r.chess_results,
			fmtDate(r.date),
			r.rating_type,
			r.championship_id,
		],
	},
	{
		table: "circuits",
		columns: ["id", "name", "type"],
		map: (r) => [r.id, r.name, r.type],
	},
	{
		// posts.id is a UUID string in PG but an integer autoincrement in D1 — drop it.
		table: "posts",
		columns: ["title", "image_url", "content", "slug", "published", "created_at", "updated_at"],
		map: (r) => [
			r.title,
			r.image,
			r.content,
			r.slug,
			boolToInt(r.published),
			fmtTimestamp(r.created_at),
			fmtTimestamp(r.updated_at),
		],
	},
	{
		table: "announcements",
		columns: ["id", "year", "number", "content"],
		map: (r) => [r.id, r.year, toInt(r.number), r.content],
	},
	{
		table: "players_to_roles",
		columns: ["id", "player_id", "role_id"],
		map: (r) => [r.id, r.player_id, r.role_id],
	},
	{
		table: "players_to_titles",
		columns: ["id", "player_id", "title_id"],
		map: (r) => [r.id, r.player_id, r.title_id],
	},
	{
		table: "players_to_norms",
		columns: ["id", "player_id", "norm_id"],
		map: (r) => [r.id, r.player_id, r.norm_id],
	},
	{
		table: "players_to_insignias",
		columns: ["id", "player_id", "insignia_id"],
		map: (r) => [r.id, r.player_id, r.insignia_id],
	},
	{
		table: "players_to_tournaments",
		columns: ["id", "player_id", "tournament_id", "old_rating", "variation"],
		map: (r) => [r.id, r.player_id, r.tournament_id, r.old_rating, r.variation],
	},
	{
		table: "tournament_podiums",
		columns: ["id", "player_id", "tournament_id", "place"],
		map: (r) => [r.id, r.player_id, r.tournament_id, r.place],
	},
	{
		table: "defending_champions",
		columns: ["id", "player_id", "championship_id"],
		map: (r) => [r.id, r.player_id, r.championship_id],
	},
	{
		table: "circuit_phases",
		columns: ["id", "circuit_id", "club_id", "tournament_id", "sort_order"],
		map: (r) => [r.id, r.circuit_id, r.club_id, r.tournament_id, r.order],
	},
	{
		table: "circuit_podiums",
		columns: ["id", "player_id", "circuit_phase_id", "category", "place", "points"],
		map: (r) => [r.id, r.player_id, r.circuit_phase_id, r.category, toInt(r.place), r.points],
	},
	{
		table: "cups",
		columns: [
			"id",
			"name",
			"image_url",
			"start_date",
			"end_date",
			"prize_pool",
			"rating_type",
			"championship_id",
		],
		map: (r) => [
			r.id,
			r.name,
			r.image_url,
			fmtDate(r.start_date),
			fmtDate(r.end_date),
			r.prize_pool,
			r.rhythm,
			r.championship_id,
		],
	},
	{
		table: "cup_brackets",
		columns: ["id", "cup_id", "bracket_type"],
		map: (r) => [r.id, r.cup_id, r.bracket_type],
	},
	{
		table: "cup_groups",
		columns: ["id", "cup_id", "name", "sort_order"],
		map: (r) => [r.id, r.cup_id, r.name, r.order],
	},
	{
		table: "cup_players",
		columns: ["id", "player_id", "cup_group_id", "nickname", "position"],
		map: (r) => [r.id, r.player_id, r.cup_group_id, r.nickname, r.position],
	},
	{
		table: "cup_rounds",
		columns: ["id", "cup_group_id", "sort_order"],
		map: (r) => [r.id, r.cup_group_id, r.order],
	},
	{
		table: "cup_playoffs",
		columns: ["id", "cup_bracket_id", "phase_type", "sort_order"],
		map: (r) => [r.id, r.cup_bracket_id, r.phase_type, r.order],
	},
	{
		table: "cup_matches",
		columns: [
			"id",
			"player_one_id",
			"player_two_id",
			"winner_id",
			"cup_round_id",
			"cup_playoff_id",
			"best_of",
			"sort_order",
			"date",
		],
		map: (r) => [
			r.id,
			r.player_one_id,
			r.player_two_id,
			r.winner_id,
			r.cup_round_id,
			r.cup_playoff_id,
			r.best_of,
			r.order,
			fmtDate(r.date),
		],
	},
	{
		table: "cup_games",
		columns: ["id", "winner_id", "cup_match_id", "game_number", "link"],
		map: (r) => [r.id, r.winner_id, r.cup_match_id, r.game_number, r.link],
	},
]

async function run() {
	console.log(
		LOCAL
			? "Migrating from Postgres to local D1 (Miniflare)...\n"
			: "Reading from Postgres and generating migration-data.sql...\n",
	)

	const statements: string[] = []

	for (const spec of specs) {
		const rows = (await sql.unsafe(`select * from ${spec.table}`)) as Record<
			string,
			unknown
		>[]

		if (rows.length === 0) {
			console.log(`  - ${spec.table}: 0 rows (skipped)`)
			continue
		}

		const colList = spec.columns.map((c) => `"${c}"`).join(", ")
		const values = rows.map((r) => `(${spec.map(r).map(lit).join(", ")})`)

		// D1 limits each SQL statement to 100 KB (SQLITE_TOOBIG beyond that),
		// so batch rows per INSERT by approximate byte size.
		const MAX_BATCH_BYTES = 90_000
		let batch: string[] = []
		let batchBytes = 0
		const flush = () => {
			if (batch.length === 0) return
			statements.push(
				`INSERT INTO "${spec.table}" (${colList}) VALUES\n${batch.join(",\n")}`,
			)
			batch = []
			batchBytes = 0
		}
		for (const v of values) {
			const len = Buffer.byteLength(v, "utf8") + 2
			if (batch.length > 0 && batchBytes + len > MAX_BATCH_BYTES) flush()
			batch.push(v)
			batchBytes += len
		}
		flush()
		console.log(`  - ${spec.table}: ${rows.length} rows`)
	}

	if (LOCAL) {
		await migrateLocal(statements)
	} else {
		const outPath = resolve(scriptDir, "../migration-data.sql")
		// Wipe existing data first so re-running the file is idempotent.
		const deletes = [...specs].reverse().map((s) => `DELETE FROM "${s.table}";`)
		writeFileSync(
			outPath,
			`${deletes.join("\n")}\n\n${statements.join(";\n\n")};\n`,
		)
		console.log(`\nWrote ${statements.length} statements to ${outPath}`)
		console.log(
			"\nApply it to remote D1 (after `bun run deploy`):\n" +
				"  bunx wrangler d1 execute <DATABASE_ID> --remote --file=./packages/db/migration-data.sql",
		)
	}

	await sql.end()
}

// Same Miniflare setup as seed.ts so we hit the exact local D1 that
// `alchemy dev` uses (persisted under .alchemy/miniflare/v3).
async function migrateLocal(statements: string[]) {
	const wranglerConfigPath = fileURLToPath(
		new URL("../../../apps/web/.alchemy/local/wrangler.jsonc", import.meta.url),
	)
	const d1PersistRoot = fileURLToPath(
		new URL("../../../.alchemy/miniflare/v3", import.meta.url),
	)
	const migrationsDir = resolve(scriptDir, "migrations")

	const raw = readFileSync(wranglerConfigPath, "utf8")
	const stripped = raw
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/(^|[^:])\/\/.*$/gm, "$1")
		.replace(/,\s*([}\]])/g, "$1")
	const d1Config = JSON.parse(stripped).d1_databases?.find(
		(db: { binding: string }) => db.binding === "DB",
	)
	if (!d1Config?.database_id) {
		throw new Error(
			`No D1 binding "DB" found in ${wranglerConfigPath}. Run "alchemy dev" first to generate the local config.`,
		)
	}

	const miniflare = new Miniflare({
		script: "",
		modules: true,
		defaultPersistRoot: d1PersistRoot,
		d1Persist: true,
		d1Databases: { DB: d1Config.database_id },
	})

	try {
		await miniflare.ready
		const d1 = await miniflare.getD1Database("DB")

		// Apply drizzle migrations first, using the same `d1_migrations` table as
		// alchemy dev, so this is idempotent and stays in sync with `alchemy dev`.
		const tableInfo = await d1.prepare(`PRAGMA table_info(d1_migrations)`).all()
		if (tableInfo.results.length === 0) {
			await d1
				.prepare(
					`CREATE TABLE d1_migrations (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL,
						applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
						type TEXT NOT NULL
					)`,
				)
				.run()
		}
		const applied = await d1.prepare(`SELECT name FROM d1_migrations`).all()
		const appliedNames = new Set(applied.results.map((r) => r.name as string))

		const migrationFiles = readdirSync(migrationsDir)
			.filter((f) => f.endsWith(".sql"))
			.sort()
		for (const file of migrationFiles) {
			if (appliedNames.has(file)) continue
			const sqlText = readFileSync(resolve(migrationsDir, file), "utf8")
			for (const s of sqlText
				.split("--> statement-breakpoint")
				.map((x) => x.trim())
				.filter(Boolean)) {
				await d1.prepare(s).run()
			}
			await d1
				.prepare(`INSERT INTO d1_migrations (name, type) VALUES (?, ?)`)
				.bind(file, "migration")
				.run()
			console.log(`  ✓ applied migration ${file}`)
		}

		// Wipe existing domain data first so re-running is idempotent.
		// Auth tables (user/session/account/verification) are left untouched.
		for (const spec of [...specs].reverse()) {
			await d1.prepare(`DELETE FROM "${spec.table}"`).run()
		}

		for (const stmt of statements) {
			await d1.prepare(stmt).run()
		}

		console.log(`\n✅ Inserted ${statements.length} statements into local D1.`)
	} finally {
		await miniflare.dispose()
	}
}

run().catch(async (err) => {
	console.error("Migration generation failed:", err)
	await sql.end()
	process.exit(1)
})
