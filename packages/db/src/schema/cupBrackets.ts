import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { cups, cupPlayoffs } from "./index"

export const cupBrackets = sqliteTable("cup_brackets", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	cupId: integer("cup_id").notNull().references(() => cups.id),
	bracketType: text("bracket_type").notNull(),
})

export const cupBracketsRelations = relations(cupBrackets, ({ one, many }) => ({
	cup: one(cups, { fields: [cupBrackets.cupId], references: [cups.id] }),
	cupPlayoffs: many(cupPlayoffs),
}))

export const insertCupBracketSchema = createInsertSchema(cupBrackets)
export type CupBracket = typeof cupBrackets.$inferSelect
export type NewCupBracket = typeof cupBrackets.$inferInsert
