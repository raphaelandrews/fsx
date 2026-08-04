import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { cups, defendingChampions, tournaments } from "./index"

export const championships = sqliteTable("championships", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
})

export const championshipsRelations = relations(championships, ({ many }) => ({
	cups: many(cups),
	defendingChampions: many(defendingChampions),
	tournaments: many(tournaments),
}))

export const insertChampionshipsSchema = createInsertSchema(championships)

export type Championship = typeof championships.$inferSelect
export type NewChampionship = typeof championships.$inferInsert
