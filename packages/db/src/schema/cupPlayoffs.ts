import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { cupMatches, cupBrackets } from "./index"

export const cupPlayoffs = sqliteTable("cup_playoffs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	cupBracketId: integer("cup_bracket_id").notNull().references(() => cupBrackets.id, { onDelete: "cascade" }),
	phaseType: text("phase_type").notNull(),
	order: integer("order").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
})

export const cupPlayoffsRelations = relations(cupPlayoffs, ({ one, many }) => ({
	cupBracket: one(cupBrackets, { fields: [cupPlayoffs.cupBracketId], references: [cupBrackets.id] }),
	cupMatches: many(cupMatches),
}))

export const insertCupPlayoffSchema = createInsertSchema(cupPlayoffs)
export type CupPlayoff = typeof cupPlayoffs.$inferSelect
export type NewCupPlayoff = typeof cupPlayoffs.$inferInsert
