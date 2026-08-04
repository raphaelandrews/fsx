import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToInsignias } from "./index"

export const insignias = sqliteTable("insignias", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	insignia: text("insignia").notNull().unique(),
	level: integer("level").notNull(),
})

export const playerInsigniaRelations = relations(insignias, ({ many }) => ({
	playersToInsignia: many(playersToInsignias),
}))

export const insertInsigniaSchema = createInsertSchema(insignias)
export type Insignia = typeof insignias.$inferSelect
export type NewInsignia = typeof insignias.$inferInsert
