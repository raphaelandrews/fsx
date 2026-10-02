import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { players, tournaments } from "./index"

export const playersToTournaments = sqliteTable("players_to_tournaments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "restrict" }),
	tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "restrict" }),
	oldRating: integer("old_rating").notNull(),
	variation: integer("variation").notNull(),
	ratingType: text("rating_type").notNull().default("rapid"),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (t) => [
    uniqueIndex("player_tournament").on(t.playerId, t.tournamentId),
    check("players_to_tournaments_old_rating_check", sql`${t.oldRating} BETWEEN 0 AND 4000`),
    check("players_to_tournaments_variation_check", sql`${t.variation} BETWEEN -4000 AND 4000`),
    check("players_to_tournaments_rating_type_check", sql`${t.ratingType} IN ('blitz', 'rapid', 'classic')`),
])

export const playersToTournamentsRelations = relations(playersToTournaments, ({ one }) => ({
	player: one(players, { fields: [playersToTournaments.playerId], references: [players.id] }),
	tournament: one(tournaments, { fields: [playersToTournaments.tournamentId], references: [tournaments.id] }),
}))

export const insertPlayerToTournamentSchema = createInsertSchema(playersToTournaments)
export type PlayerToTournament = typeof playersToTournaments.$inferSelect
export type NewPlayerToTournament = typeof playersToTournaments.$inferInsert
