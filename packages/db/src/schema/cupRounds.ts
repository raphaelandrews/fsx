import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { cupGroups, cupMatches } from "./index"

export const cupRounds = sqliteTable("cup_rounds", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	cupGroupId: integer("cup_group_id").notNull().references(() => cupGroups.id, { onDelete: "cascade" }),
	sortOrder: integer("sort_order").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const cupRoundsRelations = relations(cupRounds, ({ one, many }) => ({
	cupGroup: one(cupGroups, { fields: [cupRounds.cupGroupId], references: [cupGroups.id] }),
	cupMatches: many(cupMatches),
}))

export const insertCupRoundSchema = createInsertSchema(cupRounds)
export type CupRound = typeof cupRounds.$inferSelect
export type NewCupRound = typeof cupRounds.$inferInsert
