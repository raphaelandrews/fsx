import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { COMPETITION_CATEGORIES } from "../competition"
import { sqlInList } from "../sql-in-list"
import { players, tournaments } from "./index"

export const tournamentPodiums = sqliteTable(
	"tournament_podiums",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "restrict" }),
		tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
		place: integer("place").notNull(),
		// NULL is the overall (Absoluto) result; a category podium is a separate prize.
		category: text("category"),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(t) => [
		// Two partial indexes because a NULL category would never collide in one.
		uniqueIndex("player_tournament_podium").on(t.playerId, t.tournamentId).where(sql`${t.category} IS NULL`),
		uniqueIndex("player_tournament_category_podium").on(t.playerId, t.tournamentId, t.category).where(sql`${t.category} IS NOT NULL`),
        index("tournament_podiums_tournament_place_idx").on(t.tournamentId, t.place),
        check("tournament_podiums_place_check", sql`${t.place} BETWEEN 1 AND 100000`),
        check("tournament_podiums_category_check", sql`${t.category} IS NULL OR ${t.category} IN (${sqlInList(COMPETITION_CATEGORIES)})`),
	],
)

export const tournamentPodiumsRelations = relations(tournamentPodiums, ({ one }) => ({
	player: one(players, { fields: [tournamentPodiums.playerId], references: [players.id] }),
	tournament: one(tournaments, { fields: [tournamentPodiums.tournamentId], references: [tournaments.id] }),
}))

export const insertTournamentPodiumSchema = createInsertSchema(tournamentPodiums)
export type TournamentPodium = typeof tournamentPodiums.$inferSelect
export type NewTournamentPodium = typeof tournamentPodiums.$inferInsert
