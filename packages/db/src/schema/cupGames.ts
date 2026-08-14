import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { players, cupMatches } from "./index"

export const cupGames = sqliteTable(
	"cup_games",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		winnerId: integer("winner_id").references(() => players.id),
		cupMatchId: integer("cup_match_id").notNull().references(() => cupMatches.id, { onDelete: "cascade" }),
		gameNumber: integer("game_number").notNull(),
		link: text("link"),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [index("cup_games_match_game_idx").on(table.cupMatchId, table.gameNumber)],
)

export const cupGamesRelations = relations(cupGames, ({ one }) => ({
	winnerId: one(players, { fields: [cupGames.winnerId], references: [players.id] }),
	cupMatch: one(cupMatches, { fields: [cupGames.cupMatchId], references: [cupMatches.id] }),
}))

export const insertCupGameSchema = createInsertSchema(cupGames)
export type CupGame = typeof cupGames.$inferSelect
export type NewCupGame = typeof cupGames.$inferInsert
