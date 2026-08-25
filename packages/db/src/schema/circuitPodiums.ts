import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases, players } from "./index"

export const circuitPodiums = sqliteTable("circuit_podiums", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "restrict" }),
	circuitPhaseId: integer("circuit_phase_id").notNull().references(() => circuitPhases.id, { onDelete: "cascade" }),
	category: text("category"),
	place: integer("place"),
	points: real("points").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const circuitPodiumsRelations = relations(circuitPodiums, ({ one }) => ({
	player: one(players, { fields: [circuitPodiums.playerId], references: [players.id] }),
	circuitPhases: one(circuitPhases, { fields: [circuitPodiums.circuitPhaseId], references: [circuitPhases.id] }),
}))

export const insertCircuitPodiumSchema = createInsertSchema(circuitPodiums)
export type CircuitPodium = typeof circuitPodiums.$inferSelect
export type NewCircuitPodium = typeof circuitPodiums.$inferInsert
