import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { players } from "./index"

export const announcements = sqliteTable(
	"announcements",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		year: integer("year").notNull(),
		number: integer("number").notNull(),
		content: text("content").notNull().unique(),
		// The player the announcement is about (a title, a norm, a penalty…), if any.
		playerId: integer("player_id").references(() => players.id, { onDelete: "restrict" }),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
    (t) => [
        uniqueIndex("year_number").on(t.year, t.number),
        index("announcements_player_idx").on(t.playerId),
        check("announcements_year_check", sql`${t.year} BETWEEN 1900 AND 2200`),
        check("announcements_number_check", sql`${t.number} > 0`),
    ],
)

export const insertAnnouncementSchema = createInsertSchema(announcements)

export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert

export const announcementsRelations = relations(announcements, ({ one }) => ({
	player: one(players, { fields: [announcements.playerId], references: [players.id] }),
}))
