import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { players, tournaments } from "./index"

export const playersToTournaments = sqliteTable("players_to_tournaments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "restrict" }),
	tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
	oldRating: integer("old_rating").notNull(),
	variation: integer("variation").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (t) => [uniqueIndex("player_tournament").on(t.playerId, t.tournamentId)])

export const playersToTournamentsRelations = relations(playersToTournaments, ({ one }) => ({
	player: one(players, { fields: [playersToTournaments.playerId], references: [players.id] }),
	tournament: one(tournaments, { fields: [playersToTournaments.tournamentId], references: [tournaments.id] }),
}))

export const insertPlayerToTournamentSchema = createInsertSchema(playersToTournaments)
export type PlayerToTournament = typeof playersToTournaments.$inferSelect
export type NewPlayerToTournament = typeof playersToTournaments.$inferInsert
