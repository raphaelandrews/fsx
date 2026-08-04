import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable } from "drizzle-orm/sqlite-core"

import { circuitPodiums, circuits, clubs, tournaments } from "./index"

export const circuitPhases = sqliteTable("circuit_phases", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	circuitId: integer("circuit_id").notNull().references(() => circuits.id),
	clubId: integer("club_id").references(() => clubs.id),
	tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
	order: integer("order").notNull(),
})

export const circuitPhasesRelations = relations(circuitPhases, ({ one, many }) => ({
	circuit: one(circuits, { fields: [circuitPhases.circuitId], references: [circuits.id] }),
	club: one(clubs, { fields: [circuitPhases.clubId], references: [clubs.id] }),
	tournament: one(tournaments, { fields: [circuitPhases.tournamentId], references: [tournaments.id] }),
	circuitPodiums: many(circuitPodiums),
}))

export const insertCircuitPhaseSchema = createInsertSchema(circuitPhases)
export type CircuitPhase = typeof circuitPhases.$inferSelect
export type NewCircuitPhase = typeof circuitPhases.$inferInsert
