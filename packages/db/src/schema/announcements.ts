import { createInsertSchema } from "drizzle-zod"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const announcements = sqliteTable(
	"announcements",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		year: integer("year").notNull(),
		number: text("number").notNull(),
		content: text("content").notNull().unique(),
	},
	(t) => [uniqueIndex("year_number").on(t.year, t.number)]
)

export const insertAnnouncementSchema = createInsertSchema(announcements)

export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
