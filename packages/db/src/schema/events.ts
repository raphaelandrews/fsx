import { createInsertSchema } from "drizzle-zod"
import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const events = sqliteTable(
	"events",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull().unique(),
		chessResults: text("chess_results"),
		startDate: text("start_date").notNull(),
		endDate: text("end_date"),
		regulation: text("regulation"),
		form: text("form"),
		type: text("type").notNull(),
		timeControl: text("time_control").notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [index("events_start_date_idx").on(table.startDate)],
)

export const insertEventSchema = createInsertSchema(events)
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
