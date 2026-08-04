import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases, players } from "./index"

export const clubs = sqliteTable("clubs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	logo: text("logo"),
})

export const clubsRelations = relations(clubs, ({ many }) => ({
	circuitPhases: many(circuitPhases),
	players: many(players),
}))

export const insertClubSchema = createInsertSchema(clubs)
export type Club = typeof clubs.$inferSelect
export type NewClub = typeof clubs.$inferInsert
