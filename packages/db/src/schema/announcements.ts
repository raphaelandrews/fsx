import { createInsertSchema } from "drizzle-zod"
import { sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const announcements = sqliteTable(
	"announcements",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		year: integer("year").notNull(),
		number: integer("number").notNull(),
		content: text("content").notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(t) => [uniqueIndex("year_number").on(t.year, t.number)],
)

export const insertAnnouncementSchema = createInsertSchema(announcements)

export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
