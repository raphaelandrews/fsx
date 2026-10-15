import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core"

import { circuitPhases, players } from "./index"

export const clubs = pgTable("clubs", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 80 }).notNull().unique(),
	logo: text("logo"),
})

export const clubsRelations = relations(clubs, ({ many }) => ({
	circuitPhases: many(circuitPhases),
	players: many(players),
}))

export const insertClubSchema = createInsertSchema(clubs)

export type Club = typeof clubs.$inferSelect
export type NewClub = typeof clubs.$inferInsert
