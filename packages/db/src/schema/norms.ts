import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToNorms } from "./index"

export const norms = sqliteTable("norms", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	norm: text("norm").notNull().unique(),
})

export const playerNormsRelations = relations(norms, ({ many }) => ({
	playersToNorms: many(playersToNorms),
}))

export const insertNormSchema = createInsertSchema(norms)
export type Norm = typeof norms.$inferSelect
export type NewNorm = typeof norms.$inferInsert
