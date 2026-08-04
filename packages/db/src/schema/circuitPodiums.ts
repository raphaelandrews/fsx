import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases, players } from "./index"

export const circuitPodiums = sqliteTable("circuit_podiums", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id),
	circuitPhaseId: integer("circuit_phase_id").notNull().references(() => circuitPhases.id),
	category: text("category"),
	place: text("place").notNull(),
	points: integer("points").notNull(),
})

export const circuitPodiumsRelations = relations(circuitPodiums, ({ one }) => ({
	player: one(players, { fields: [circuitPodiums.playerId], references: [players.id] }),
	circuitPhase: one(circuitPhases, { fields: [circuitPodiums.circuitPhaseId], references: [circuitPhases.id] }),
}))

export const insertCircuitPodiumSchema = createInsertSchema(circuitPodiums)
export type CircuitPodium = typeof circuitPodiums.$inferSelect
export type NewCircuitPodium = typeof circuitPodiums.$inferInsert
