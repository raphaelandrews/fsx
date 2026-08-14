import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { players, titles } from "./index"

export const playersToTitles = sqliteTable("players_to_titles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
	titleId: integer("title_id").notNull().references(() => titles.id, { onDelete: "cascade" }),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (t) => [uniqueIndex("player_title").on(t.playerId, t.titleId)])

export const playersToTitlesRelations = relations(playersToTitles, ({ one }) => ({
	player: one(players, { fields: [playersToTitles.playerId], references: [players.id] }),
	title: one(titles, { fields: [playersToTitles.titleId], references: [titles.id] }),
}))

export const insertPlayerToTitleSchema = createInsertSchema(playersToTitles)
export type PlayerToTitle = typeof playersToTitles.$inferSelect
export type NewPlayerToTitle = typeof playersToTitles.$inferInsert
