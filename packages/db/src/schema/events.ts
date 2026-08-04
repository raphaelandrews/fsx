import { createInsertSchema } from "drizzle-zod"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const events = sqliteTable("events", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	chessResults: text("chess_results"),
	startDate: text("start_date").notNull(),
	endDate: text("end_date"),
	regulation: text("regulation"),
	form: text("form"),
	type: text("type").notNull(),
	timeControl: text("time_control").notNull(),
})

export const insertEventSchema = createInsertSchema(events)
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
