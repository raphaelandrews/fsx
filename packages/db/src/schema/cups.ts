import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { championships, cupBrackets, cupGroups } from "./index"

export const cups = sqliteTable("cups", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	imageUrl: text("image_url").notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date").notNull(),
	prizePool: integer("prize_pool").notNull(),
	ratingType: text("rating_type").notNull(),
	championshipId: integer("championship_id").references(() => championships.id),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const cupsRelations = relations(cups, ({ one, many }) => ({
	championship: one(championships, { fields: [cups.championshipId], references: [championships.id] }),
	cupBrackets: many(cupBrackets),
	cupGroups: many(cupGroups),
}))

export const insertCupSchema = createInsertSchema(cups)
export type Cup = typeof cups.$inferSelect
export type NewCup = typeof cups.$inferInsert
