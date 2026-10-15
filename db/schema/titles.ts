import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core"

import { playersToTitles } from "./playersToTitles"

export const titleTypeEnum = pgEnum("title_type", ["internal", "external"])

export const titles = pgTable("titles", {
	id: serial("id").primaryKey(),
	title: varchar("title", { length: 40 }).notNull().unique(),
	shortTitle: varchar("short_title", { length: 4 }).notNull(),
	type: titleTypeEnum("type").notNull(),
})

export const playerTitlesRelations = relations(titles, ({ many }) => ({
	playersToTitles: many(playersToTitles),
}))

export const insertTitleSchema = createInsertSchema(titles)

export type Title = typeof titles.$inferSelect
export type NewTitle = typeof titles.$inferInsert
