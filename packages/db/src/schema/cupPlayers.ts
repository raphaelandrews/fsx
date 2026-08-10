import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { players, cupGroups } from "./index"

export const cupPlayers = sqliteTable("cup_players", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
	cupGroupId: integer("cup_group_id").notNull().references(() => cupGroups.id, { onDelete: "cascade" }),
	nickname: text("nickname"),
	position: integer("position"),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
})

export const cupPlayersRelations = relations(cupPlayers, ({ one }) => ({
	player: one(players, { fields: [cupPlayers.playerId], references: [players.id] }),
	cupGroup: one(cupGroups, { fields: [cupPlayers.cupGroupId], references: [cupGroups.id] }),
}))

export const insertCupPlayerSchema = createInsertSchema(cupPlayers)
export type CupPlayer = typeof cupPlayers.$inferSelect
export type NewCupPlayer = typeof cupPlayers.$inferInsert
