import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { championships, players } from "./index"

export const defendingChampions = sqliteTable("defending_champions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
	championshipId: integer("championship_id").notNull().references(() => championships.id, { onDelete: "cascade" }),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (t) => [uniqueIndex("defending_champion").on(t.playerId, t.championshipId)])

export const defendingChampionsRelations = relations(defendingChampions, ({ one }) => ({
	player: one(players, { fields: [defendingChampions.playerId], references: [players.id] }),
	championship: one(championships, { fields: [defendingChampions.championshipId], references: [championships.id] }),
}))

export const insertDefendingChampionSchema = createInsertSchema(defendingChampions)
export type DefendingChampion = typeof defendingChampions.$inferSelect
export type NewDefendingChampion = typeof defendingChampions.$inferInsert
