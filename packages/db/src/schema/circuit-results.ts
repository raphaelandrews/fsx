import { relations, sql } from "drizzle-orm"
import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { categories, circuitPhases, circuits, clubs, players } from "./index"

// Despite the name, rows are a player's points in one stage (etapa), or in the
// circuit itself for phase-less "geral" rankings; standings are their sums.
// Official final placings live in circuit_final_podiums. The check enforces
// exactly one target.
export const circuitResults = sqliteTable(
	"circuit_results",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "restrict" }),
		circuitId: integer("circuit_id").references(() => circuits.id, { onDelete: "cascade" }),
		circuitPhaseId: integer("circuit_phase_id").references(() => circuitPhases.id, { onDelete: "cascade" }),
		// The club the player represented when the result was saved; club rankings group by it.
		clubId: integer("club_id").references(() => clubs.id),
		category: text("category").references(() => categories.name, { onUpdate: "cascade", onDelete: "restrict" }),
		place: integer("place"),
		points: real("points").notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(t) => [
		index("circuit_results_circuit_phase_idx").on(t.circuitPhaseId),
		index("circuit_results_circuit_idx").on(t.circuitId),
		index("circuit_results_player_idx").on(t.playerId),
		index("circuit_results_club_idx").on(t.clubId),
        check("circuit_results_target_check", sql`(${t.circuitId} IS NULL) <> (${t.circuitPhaseId} IS NULL)`),
        check("circuit_results_points_check", sql`${t.points} BETWEEN 0 AND 1000000`),
        check("circuit_results_place_check", sql`${t.place} IS NULL OR ${t.place} BETWEEN 1 AND 1000`),
	],
)

export const circuitResultsRelations = relations(circuitResults, ({ one }) => ({
	player: one(players, { fields: [circuitResults.playerId], references: [players.id] }),
	club: one(clubs, { fields: [circuitResults.clubId], references: [clubs.id] }),
	circuit: one(circuits, { fields: [circuitResults.circuitId], references: [circuits.id] }),
	circuitPhases: one(circuitPhases, { fields: [circuitResults.circuitPhaseId], references: [circuitPhases.id] }),
}))

export type CircuitResult = typeof circuitResults.$inferSelect
export type NewCircuitResult = typeof circuitResults.$inferInsert
