import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { COMPETITION_CATEGORIES } from "../competition"
import { sqlInList } from "../sql-in-list"
import { circuits, players } from "./index"

// Official final placings of a finished circuit, per category (NULL = overall).
// Snapshotted from the summed stage points when the circuit is finished, then
// editable, so champions survive later edits to stage points. `restrict` on the
// circuit: a finished circuit must be reopened before it can be deleted.
export const circuitFinalPodiums = sqliteTable(
	"circuit_final_podiums",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		circuitId: integer("circuit_id").notNull().references(() => circuits.id, { onDelete: "restrict" }),
		playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "restrict" }),
		category: text("category"),
		place: integer("place").notNull(),
		points: real("points"),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(t) => [
		uniqueIndex("circuit_final_podium_player").on(t.circuitId, t.playerId).where(sql`${t.category} IS NULL`),
		uniqueIndex("circuit_final_podium_category_player").on(t.circuitId, t.category, t.playerId).where(sql`${t.category} IS NOT NULL`),
		index("circuit_final_podiums_player_idx").on(t.playerId),
		check("circuit_final_podiums_place_check", sql`${t.place} BETWEEN 1 AND 1000`),
		check("circuit_final_podiums_points_check", sql`${t.points} IS NULL OR ${t.points} BETWEEN 0 AND 1000000`),
		check("circuit_final_podiums_category_check", sql`${t.category} IS NULL OR ${t.category} IN (${sqlInList(COMPETITION_CATEGORIES)})`),
	],
)

export const circuitFinalPodiumsRelations = relations(circuitFinalPodiums, ({ one }) => ({
	circuit: one(circuits, { fields: [circuitFinalPodiums.circuitId], references: [circuits.id] }),
	player: one(players, { fields: [circuitFinalPodiums.playerId], references: [players.id] }),
}))

export const insertCircuitFinalPodiumSchema = createInsertSchema(circuitFinalPodiums)
export type CircuitFinalPodium = typeof circuitFinalPodiums.$inferSelect
export type NewCircuitFinalPodium = typeof circuitFinalPodiums.$inferInsert
