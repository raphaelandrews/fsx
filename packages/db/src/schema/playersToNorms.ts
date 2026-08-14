import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { norms, players } from "./index"

export const playersToNorms = sqliteTable("players_to_norms", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
	normId: integer("norm_id").notNull().references(() => norms.id, { onDelete: "cascade" }),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (t) => [uniqueIndex("player_norm").on(t.playerId, t.normId)])

export const playersToNormsRelations = relations(playersToNorms, ({ one }) => ({
	player: one(players, { fields: [playersToNorms.playerId], references: [players.id] }),
	norm: one(norms, { fields: [playersToNorms.normId], references: [norms.id] }),
}))

export const insertPlayerToNormSchema = createInsertSchema(playersToNorms)
export type PlayerToNorm = typeof playersToNorms.$inferSelect
export type NewPlayerToNorm = typeof playersToNorms.$inferInsert
