import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { championships, cupBrackets, cupGroups } from "./index"

export const cups = sqliteTable("cups", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	imageUrl: text("image_url").notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date").notNull(),
	prizePool: integer("prize_pool").notNull(),
	rhythm: text("rhythm").notNull(),
	championshipId: integer("championship_id").references(() => championships.id),
})

export const cupRelations = relations(cups, ({ one, many }) => ({
	championship: one(championships, { fields: [cups.championshipId], references: [championships.id] }),
	cupBrackets: many(cupBrackets),
	cupGroups: many(cupGroups),
}))

export const insertCupSchema = createInsertSchema(cups)
export type Cup = typeof cups.$inferSelect
export type NewCup = typeof cups.$inferInsert
