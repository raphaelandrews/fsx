import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core"

import { players, tournaments } from "./index"

export const tournamentPodiums = sqliteTable("tournament_podiums", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id),
	tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
	place: integer("place").notNull(),
}, (t) => [uniqueIndex("player_tournament_podium").on(t.playerId, t.tournamentId)])

export const tournamentPodiumsRelations = relations(tournamentPodiums, ({ one }) => ({
	player: one(players, { fields: [tournamentPodiums.playerId], references: [players.id] }),
	tournament: one(tournaments, { fields: [tournamentPodiums.tournamentId], references: [tournaments.id] }),
}))

export const insertTournamentPodiumSchema = createInsertSchema(tournamentPodiums)
export type TournamentPodium = typeof tournamentPodiums.$inferSelect
export type NewTournamentPodium = typeof tournamentPodiums.$inferInsert
