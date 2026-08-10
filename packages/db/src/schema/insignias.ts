import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToInsignias } from "./index"

export const insignias = sqliteTable("insignias", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	insignia: text("insignia").notNull().unique(),
	level: integer("level").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
})

export const insigniasRelations = relations(insignias, ({ many }) => ({
	playersToInsignias: many(playersToInsignias),
}))

export const insertInsigniaSchema = createInsertSchema(insignias)
export type Insignia = typeof insignias.$inferSelect
export type NewInsignia = typeof insignias.$inferInsert
