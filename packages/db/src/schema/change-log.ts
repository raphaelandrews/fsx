import { sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const CHANGE_ENTITIES = ["player", "tournament", "podium"] as const
export type ChangeEntity = (typeof CHANGE_ENTITIES)[number]
export const CHANGE_ACTIONS = ["create", "update", "delete"] as const
export type ChangeAction = (typeof CHANGE_ACTIONS)[number]

// What the administrator changed, kept for investigation and undoing by hand. No foreign key on purpose:
// a deleted record's history must outlive it. `changes` is JSON `{ field: [before, after] }`.
export const changeLog = sqliteTable(
	"change_log",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		actor: text("actor").notNull(),
		entity: text("entity").notNull(),
		recordId: integer("record_id").notNull(),
		label: text("label").notNull(),
		action: text("action").notNull(),
		procedure: text("procedure").notNull(),
		changes: text("changes").notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	},
	(table) => [
		index("change_log_record_idx").on(table.entity, table.recordId, table.createdAt),
		index("change_log_created_idx").on(table.createdAt),
		check("change_log_entity_check", sql`${table.entity} IN ('player', 'tournament', 'podium')`),
		check("change_log_action_check", sql`${table.action} IN ('create', 'update', 'delete')`),
	],
)

export type ChangeLogEntry = typeof changeLog.$inferSelect
