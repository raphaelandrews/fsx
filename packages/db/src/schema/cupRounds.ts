import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable } from "drizzle-orm/sqlite-core"

import { cupGroups, cupMatches } from "./index"

export const cupRounds = sqliteTable("cup_rounds", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	cupGroupId: integer("cup_group_id").notNull().references(() => cupGroups.id),
	order: integer("order").notNull(),
})

export const cupRoundsRelations = relations(cupRounds, ({ one, many }) => ({
	cupGroup: one(cupGroups, { fields: [cupRounds.cupGroupId], references: [cupGroups.id] }),
	cupMatches: many(cupMatches),
}))

export const insertCupRoundSchema = createInsertSchema(cupRounds)
export type CupRound = typeof cupRounds.$inferSelect
export type NewCupRound = typeof cupRounds.$inferInsert
