import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { championships, circuitPhases, playersToTournaments, tournamentPodiums } from "./index"

export const tournaments = sqliteTable("tournaments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	chessResults: text("chess_results"),
	date: text("date"),
	ratingType: text("rating_type").notNull(),
	championshipId: integer("championship_id").references(() => championships.id),
	// No CHECK: adding one makes drizzle-kit rebuild this referenced table, which
	// D1 cannot do safely. COMPETITION_TIERS is enforced by the API.
	tier: text("tier").notNull().default("B"),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
	check("tournaments_rating_type_check", sql`${table.ratingType} IN ('blitz', 'rapid', 'classic')`),
])

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
	championship: one(championships, { fields: [tournaments.championshipId], references: [championships.id] }),
	circuitPhases: one(circuitPhases),
	playersToTournaments: many(playersToTournaments),
	tournamentPodiums: many(tournamentPodiums),
}))

export const insertTournamentSchema = createInsertSchema(tournaments)
export type Tournament = typeof tournaments.$inferSelect
export type NewTournament = typeof tournaments.$inferInsert
