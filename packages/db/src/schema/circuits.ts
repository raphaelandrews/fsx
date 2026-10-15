import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { championships, circuitFinalPodiums, circuitPhases, circuitPodiums } from "./index"

export const circuits = sqliteTable("circuits", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	type: text("type").notNull(),
	// Added to a referenced table, so they stay CHECK-free plain ADD COLUMNs; the
	// API requires year and validates tier against COMPETITION_TIERS.
	year: integer("year"),
	tier: text("tier").notNull().default("B"),
	championshipId: integer("championship_id").references(() => championships.id),
	finishedAt: text("finished_at"),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
	check("circuits_type_check", sql`${table.type} IN ('default', 'categories', 'school', 'geral')`),
])

export const circuitsRelations = relations(circuits, ({ one, many }) => ({
	championship: one(championships, { fields: [circuits.championshipId], references: [championships.id] }),
	circuitPhases: many(circuitPhases),
	circuitPodiums: many(circuitPodiums),
	circuitFinalPodiums: many(circuitFinalPodiums),
}))

export const insertCircuitSchema = createInsertSchema(circuits)
export type Circuit = typeof circuits.$inferSelect
export type NewCircuit = typeof circuits.$inferInsert
