import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { players } from "./index"

export const locations = sqliteTable("locations", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	type: text("type").notNull(),
	flagUrl: text("flag_url"),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const locationsRelations = relations(locations, ({ many }) => ({
	players: many(players),
}))

export const insertLocationSchema = createInsertSchema(locations)
export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert
