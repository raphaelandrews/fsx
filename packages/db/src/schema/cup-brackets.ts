import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { cups, cupPlayoffs } from "./index"

export const cupBrackets = sqliteTable("cup_brackets", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	cupId: integer("cup_id").notNull().references(() => cups.id, { onDelete: "cascade" }),
	bracketType: text("bracket_type").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
	check("cup_brackets_type_check", sql`${table.bracketType} IN ('UB', 'LB', 'GF')`),
])

export const cupBracketsRelations = relations(cupBrackets, ({ one, many }) => ({
	cup: one(cups, { fields: [cupBrackets.cupId], references: [cups.id] }),
	cupPlayoffs: many(cupPlayoffs),
}))

export const insertCupBracketSchema = createInsertSchema(cupBrackets)
export type CupBracket = typeof cupBrackets.$inferSelect
export type NewCupBracket = typeof cupBrackets.$inferInsert
