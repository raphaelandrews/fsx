import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { COMPETITION_CATEGORIES } from "../competition"
import { sqlInList } from "../sql-in-list"
import { circuitPhases, circuits, players } from "./index"

// Despite the name, rows are a player's points in one stage (etapa), or in the
// circuit itself for phase-less "geral" rankings; standings are their sums.
// Official final placings live in circuit_final_podiums. The check enforces
// exactly one target.
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
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(t) => [
		index("circuit_podiums_circuit_phase_idx").on(t.circuitPhaseId),
		index("circuit_podiums_circuit_idx").on(t.circuitId),
        check("circuit_podiums_target_check", sql`(${t.circuitId} IS NULL) <> (${t.circuitPhaseId} IS NULL)`),
        check("circuit_podiums_points_check", sql`${t.points} BETWEEN 0 AND 1000000`),
        check("circuit_podiums_place_check", sql`${t.place} IS NULL OR ${t.place} BETWEEN 1 AND 1000`),
        check("circuit_podiums_category_check", sql`${t.category} IS NULL OR ${t.category} IN (${sqlInList(COMPETITION_CATEGORIES)})`),
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
