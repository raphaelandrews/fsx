import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuits, cups, defendingChampions, tournaments } from "./index"

export const championships = sqliteTable("championships", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const championshipsRelations = relations(championships, ({ many }) => ({
	circuits: many(circuits),
	cups: many(cups),
	defendingChampions: many(defendingChampions),
	tournaments: many(tournaments),
}))

export const insertChampionshipSchema = createInsertSchema(championships)

export type Championship = typeof championships.$inferSelect
export type NewChampionship = typeof championships.$inferInsert
