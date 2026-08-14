import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases } from "./index"

export const circuits = sqliteTable("circuits", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	type: text("type").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const circuitsRelations = relations(circuits, ({ many }) => ({
	circuitPhases: many(circuitPhases),
}))

export const insertCircuitSchema = createInsertSchema(circuits)
export type Circuit = typeof circuits.$inferSelect
export type NewCircuit = typeof circuits.$inferInsert
