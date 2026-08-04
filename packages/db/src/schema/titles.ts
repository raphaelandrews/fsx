import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToTitles } from "./playersToTitles"

export const titles = sqliteTable("titles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	title: text("title").notNull().unique(),
	shortTitle: text("short_title").notNull(),
	type: text("type").notNull(),
})

export const playerTitlesRelations = relations(titles, ({ many }) => ({
	playersToTitles: many(playersToTitles),
}))

export const insertTitleSchema = createInsertSchema(titles)
export type Title = typeof titles.$inferSelect
export type NewTitle = typeof titles.$inferInsert
