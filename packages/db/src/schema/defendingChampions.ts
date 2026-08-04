import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core"

import { championships, players } from "./index"

export const defendingChampions = sqliteTable("defending_champions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id),
	championshipId: integer("championship_id").notNull().references(() => championships.id),
}, (t) => [uniqueIndex("defending_champion").on(t.playerId, t.championshipId)])

export const defendingChampionsRelations = relations(defendingChampions, ({ one }) => ({
	player: one(players, { fields: [defendingChampions.playerId], references: [players.id] }),
	championship: one(championships, { fields: [defendingChampions.championshipId], references: [championships.id] }),
}))

export const insertDefendingChampionSchema = createInsertSchema(defendingChampions)
export type DefendingChampion = typeof defendingChampions.$inferSelect
export type NewDefendingChampion = typeof defendingChampions.$inferInsert
