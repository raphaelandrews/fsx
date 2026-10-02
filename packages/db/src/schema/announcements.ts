import { createInsertSchema } from "drizzle-zod"
import { sql } from "drizzle-orm"
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const announcements = sqliteTable(
	"announcements",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		year: integer("year").notNull(),
		number: integer("number").notNull(),
		content: text("content").notNull().unique(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
    (t) => [
        uniqueIndex("year_number").on(t.year, t.number),
        check("announcements_year_check", sql`${t.year} BETWEEN 1900 AND 2200`),
        check("announcements_number_check", sql`${t.number} > 0`),
    ],
)

export const insertAnnouncementSchema = createInsertSchema(announcements)

export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
