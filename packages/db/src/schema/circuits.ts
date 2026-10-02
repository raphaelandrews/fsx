import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases, circuitPodiums } from "./index"

export const circuits = sqliteTable("circuits", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	type: text("type").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
	check("circuits_type_check", sql`${table.type} IN ('default', 'categories', 'school', 'geral')`),
])

export const circuitsRelations = relations(circuits, ({ many }) => ({
	circuitPhases: many(circuitPhases),
	circuitPodiums: many(circuitPodiums),
}))

export const insertCircuitSchema = createInsertSchema(circuits)
export type Circuit = typeof circuits.$inferSelect
export type NewCircuit = typeof circuits.$inferInsert
