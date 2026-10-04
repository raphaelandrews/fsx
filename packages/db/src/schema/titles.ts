import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToTitles } from "./playersToTitles"

export const titles = sqliteTable("titles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	shortName: text("short_name").notNull(),
	type: text("type").notNull(),
	// 1–4 by the title ladder's rating (Mirim/Júnior … Grande Mestre). No CHECK:
	// players_to_titles references this table; the API validates the range.
	tier: integer("tier").notNull().default(1),
	// Youth titles are lost in the calendar year the player turns this age
	// (Normas Técnicas: Mestre Mirim 15, Mestre Júnior 19). NULL never expires.
	losesAtAge: integer("loses_at_age"),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
	check("titles_type_check", sql`${table.type} IN ('internal', 'external')`),
])

export const titlesRelations = relations(titles, ({ many }) => ({
	playersToTitles: many(playersToTitles),
}))

export const insertTitleSchema = createInsertSchema(titles)
export type Title = typeof titles.$inferSelect
export type NewTitle = typeof titles.$inferInsert
