import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { players, cupGroups } from "./index"

export const cupPlayers = sqliteTable("cup_players", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id),
	cupGroupId: integer("cup_group_id").notNull().references(() => cupGroups.id),
	nickname: text("nickname").unique(),
	position: integer("position"),
})

export const cupPlayersRelations = relations(cupPlayers, ({ one }) => ({
	player: one(players, { fields: [cupPlayers.playerId], references: [players.id] }),
	cupGroup: one(cupGroups, { fields: [cupPlayers.cupGroupId], references: [cupGroups.id] }),
}))

export const insertCupPlayerSchema = createInsertSchema(cupPlayers)
export type CupPlayer = typeof cupPlayers.$inferSelect
export type NewCupPlayer = typeof cupPlayers.$inferInsert
