import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { championships, circuitPhases, playersToTournaments, tournamentPodiums } from "./index"

export const tournaments = sqliteTable("tournaments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	chessResults: text("chess_results"),
	date: text("date"),
	ratingType: text("rating_type").notNull(),
	championshipId: integer("championship_id").references(() => championships.id),
})

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
	championship: one(championships, { fields: [tournaments.championshipId], references: [championships.id] }),
	circuitPhase: one(circuitPhases),
	playersToTournaments: many(playersToTournaments),
	tournamentPodiums: many(tournamentPodiums),
}))

export const insertTournamentSchema = createInsertSchema(tournaments)
export type Tournament = typeof tournaments.$inferSelect
export type NewTournament = typeof tournaments.$inferInsert
