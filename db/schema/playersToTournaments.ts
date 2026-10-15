import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import {
	integer,
	pgEnum,
	pgTable,
	serial,
	smallint,
	uniqueIndex,
} from "drizzle-orm/pg-core"

import { players, tournaments } from "./index"

export const playersToTournaments = pgTable(
	"players_to_tournaments",
	{
		id: serial("id").primaryKey(),
		playerId: integer("player_id")
			.notNull()
			.references(() => players.id),
		tournamentId: integer("tournament_id")
			.notNull()
			.references(() => tournaments.id),
		oldRating: smallint("old_rating").notNull(),
		variation: smallint("variation").notNull(),
	},
	(t) => [uniqueIndex("player_tournament").on(t.playerId, t.tournamentId)]
)

export const playersToTournamentsRelations = relations(
	playersToTournaments,
	({ one }) => ({
		player: one(players, {
			fields: [playersToTournaments.playerId],
			references: [players.id],
		}),
		tournament: one(tournaments, {
			fields: [playersToTournaments.tournamentId],
			references: [tournaments.id],
		}),
	})
)

export const insertPlayerToTournamentSchema =
	createInsertSchema(playersToTournaments)

export type PlayerToTournament = typeof playersToTournaments.$inferSelect
export type NewPlayerToTournament = typeof playersToTournaments.$inferInsert
