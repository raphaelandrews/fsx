import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToNorms } from "./index"

export const norms = sqliteTable("norms", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const normsRelations = relations(norms, ({ many }) => ({
	playersToNorms: many(playersToNorms),
}))

export const insertNormSchema = createInsertSchema(norms)
export type Norm = typeof norms.$inferSelect
export type NewNorm = typeof norms.$inferInsert
