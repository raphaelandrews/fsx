import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases } from "./index"

export const circuits = sqliteTable("circuits", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	type: text("type").notNull(),
})

export const circuitsRelations = relations(circuits, ({ many }) => ({
	circuitPhase: many(circuitPhases),
}))

export const insertCircuitSchema = createInsertSchema(circuits)
export type Circuit = typeof circuits.$inferSelect
export type NewCircuit = typeof circuits.$inferInsert
