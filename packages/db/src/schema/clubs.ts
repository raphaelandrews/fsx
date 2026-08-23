import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases, players, schoolResults } from "./index"

export const clubs = sqliteTable("clubs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	logoUrl: text("logo_url"),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const clubsRelations = relations(clubs, ({ many }) => ({
	circuitPhases: many(circuitPhases),
	players: many(players),
	schoolResults: many(schoolResults),
}))

export const insertClubSchema = createInsertSchema(clubs)
export type Club = typeof clubs.$inferSelect
export type NewClub = typeof clubs.$inferInsert
