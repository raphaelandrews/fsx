import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPhases, circuits, players } from "./index"

// A podium belongs to exactly one target: either a circuit phase (etapa) or the
// circuit itself (phase-less "geral" rankings). The check enforces exclusivity.
export const circuitPodiums = sqliteTable(
	"circuit_podiums",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "restrict" }),
		circuitId: integer("circuit_id").references(() => circuits.id, { onDelete: "cascade" }),
		circuitPhaseId: integer("circuit_phase_id").references(() => circuitPhases.id, { onDelete: "cascade" }),
		category: text("category"),
		place: integer("place"),
		points: real("points").notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(t) => [
		index("circuit_podiums_circuit_phase_idx").on(t.circuitPhaseId),
		index("circuit_podiums_circuit_idx").on(t.circuitId),
		check("circuit_podiums_target_check", sql`(${t.circuitId} IS NULL) <> (${t.circuitPhaseId} IS NULL)`),
	],
)

export const circuitPodiumsRelations = relations(circuitPodiums, ({ one }) => ({
	player: one(players, { fields: [circuitPodiums.playerId], references: [players.id] }),
	circuit: one(circuits, { fields: [circuitPodiums.circuitId], references: [circuits.id] }),
	circuitPhases: one(circuitPhases, { fields: [circuitPodiums.circuitPhaseId], references: [circuitPhases.id] }),
}))

export const insertCircuitPodiumSchema = createInsertSchema(circuitPodiums)
export type CircuitPodium = typeof circuitPodiums.$inferSelect
export type NewCircuitPodium = typeof circuitPodiums.$inferInsert
