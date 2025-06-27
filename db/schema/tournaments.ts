import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import {
	date,
	integer,
	pgTable,
	serial,
	text,
	varchar,
} from "drizzle-orm/pg-core"

import {
	championships,
	circuitPhases,
	playersToTournaments,
	tournamentPodiums,
} from "./index"

export const tournaments = pgTable("tournaments", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 80 }).notNull().unique(),
	chessResults: text("chess_results"),
	date: date("date", { mode: "date" }),
	championshipId: integer("championship_id").references(() => championships.id),
})

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
	championship: one(championships, {
		fields: [tournaments.championshipId],
		references: [championships.id],
	}),
	circuitPhase: one(circuitPhases),
	playersToTournaments: many(playersToTournaments),
	tournamentPodiums: many(tournamentPodiums),
}))

export const insertTournamentSchema = createInsertSchema(tournaments)

export type Tournament = typeof tournaments.$inferSelect
export type NewTournament = typeof tournaments.$inferInsert
