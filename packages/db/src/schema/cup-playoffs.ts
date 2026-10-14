import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { cupMatches, cupBrackets } from "./index"

export const cupPlayoffs = sqliteTable("cup_playoffs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	cupBracketId: integer("cup_bracket_id").notNull().references(() => cupBrackets.id, { onDelete: "cascade" }),
	phaseType: text("phase_type").notNull(),
	sortOrder: integer("sort_order").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
	check("cup_playoffs_phase_type_check", sql`${table.phaseType} IN ('Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior')`),
])

export const cupPlayoffsRelations = relations(cupPlayoffs, ({ one, many }) => ({
	cupBracket: one(cupBrackets, { fields: [cupPlayoffs.cupBracketId], references: [cupBrackets.id] }),
	cupMatches: many(cupMatches),
}))

export const insertCupPlayoffSchema = createInsertSchema(cupPlayoffs)
export type CupPlayoff = typeof cupPlayoffs.$inferSelect
export type NewCupPlayoff = typeof cupPlayoffs.$inferInsert
