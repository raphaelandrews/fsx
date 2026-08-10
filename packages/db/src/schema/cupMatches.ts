import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { players, cupGames, cupPlayoffs, cupRounds } from "./index"

export const cupMatches = sqliteTable("cup_matches", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerOneId: integer("player_one_id").notNull().references(() => players.id),
	playerTwoId: integer("player_two_id").notNull().references(() => players.id),
	winnerId: integer("winner_id").references(() => players.id),
	cupRoundId: integer("cup_round_id").references(() => cupRounds.id, { onDelete: "cascade" }),
	cupPlayoffId: integer("cup_playoff_id").references(() => cupPlayoffs.id, { onDelete: "cascade" }),
	bestOf: integer("best_of").notNull(),
	order: integer("order").notNull(),
	date: text("date").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
})

export const cupMatchesRelations = relations(cupMatches, ({ one, many }) => ({
	playerOne: one(players, { fields: [cupMatches.playerOneId], references: [players.id] }),
	playerTwo: one(players, { fields: [cupMatches.playerTwoId], references: [players.id] }),
	winner: one(players, { fields: [cupMatches.winnerId], references: [players.id] }),
	cupRound: one(cupRounds, { fields: [cupMatches.cupRoundId], references: [cupRounds.id] }),
	cupPlayoff: one(cupPlayoffs, { fields: [cupMatches.cupPlayoffId], references: [cupPlayoffs.id] }),
	cupGames: many(cupGames),
}))

export const insertCupMatchSchema = createInsertSchema(cupMatches)
export type CupMatch = typeof cupMatches.$inferSelect
export type NewCupMatch = typeof cupMatches.$inferInsert
