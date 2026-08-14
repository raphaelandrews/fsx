import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { insignias, players } from "./index"

export const playersToInsignias = sqliteTable("players_to_insignias", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
	insigniaId: integer("insignia_id").notNull().references(() => insignias.id, { onDelete: "cascade" }),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (t) => [uniqueIndex("player_insignia").on(t.playerId, t.insigniaId)])

export const playersToInsigniasRelations = relations(playersToInsignias, ({ one }) => ({
	player: one(players, { fields: [playersToInsignias.playerId], references: [players.id] }),
	insignia: one(insignias, { fields: [playersToInsignias.insigniaId], references: [insignias.id] }),
}))

export const insertPlayerToInsigniaSchema = createInsertSchema(playersToInsignias)
export type PlayerToInsignia = typeof playersToInsignias.$inferSelect
export type NewPlayerToInsignia = typeof playersToInsignias.$inferInsert
