import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPodiums, circuits, clubs, tournaments } from "./index"

export const circuitPhases = sqliteTable(
	"circuit_phases",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		circuitId: integer("circuit_id").notNull().references(() => circuits.id, { onDelete: "cascade" }),
		clubId: integer("club_id").references(() => clubs.id),
		tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
		sortOrder: integer("sort_order").notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [index("circuit_phases_circuit_sort_order_idx").on(table.circuitId, table.sortOrder)],
)

export const circuitPhasesRelations = relations(circuitPhases, ({ one, many }) => ({
	circuit: one(circuits, { fields: [circuitPhases.circuitId], references: [circuits.id] }),
	club: one(clubs, { fields: [circuitPhases.clubId], references: [clubs.id] }),
	tournament: one(tournaments, { fields: [circuitPhases.tournamentId], references: [tournaments.id] }),
	circuitPodiums: many(circuitPodiums),
}))

export const insertCircuitPhaseSchema = createInsertSchema(circuitPhases)
export type CircuitPhase = typeof circuitPhases.$inferSelect
export type NewCircuitPhase = typeof circuitPhases.$inferInsert
