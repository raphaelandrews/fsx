import { createInsertSchema } from "drizzle-zod"
import {
	pgTable,
	serial,
	smallint,
	text,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core"

export const announcements = pgTable(
	"announcements",
	{
		id: serial("id").primaryKey(),
		year: smallint("year").notNull(),
		number: varchar("number", { length: 3 }).notNull(),
		content: text("content").notNull().unique(),
	},
	(t) => [uniqueIndex("year_number").on(t.year, t.number)]
)

export const insertAnnouncementSchema = createInsertSchema(announcements)

export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
