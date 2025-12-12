import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, pgEnum, pgTable, serial, smallint } from "drizzle-orm/pg-core"

import { circuitPhases, players } from "./index"

export const circuitCategoryEnum = pgEnum("circuit_category", [
	"Sub 8 Masculino",
	"Sub 10 Masculino",
	"Sub 12 Masculino",
	"Sub 14 Masculino",
	"Sub 16 Masculino",
	"Sub 18 Masculino",
	"Sub 8 Feminino",
	"Sub 10 Feminino",
	"Sub 12 Feminino",
	"Sub 14 Feminino",
	"Sub 16 Feminino",
	"Sub 18 Feminino",
	"Futuro",
	"Juvenil",
	"Master",
])
export const circuitPlaceEnum = pgEnum("circuit_place", [
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"11",
	"12",
	"13",
	"14",
	"15",
	"16",
	"17",
	"18",
	"19",
	"20",
	"21",
	"22",
	"23",
	"24",
	"25",
])

export const circuitPodiums = pgTable("circuit_podiums", {
	id: serial("id").primaryKey(),
	playerId: integer("player_id")
		.notNull()
		.references(() => players.id),
	circuitPhaseId: integer("circuit_phase_id")
		.notNull()
		.references(() => circuitPhases.id),
	category: circuitCategoryEnum("category"),
	place: circuitPlaceEnum("place").notNull(),
	points: smallint("points").notNull(),
})

export const circuitPodiumsRelations = relations(circuitPodiums, ({ one }) => ({
	player: one(players, {
		fields: [circuitPodiums.playerId],
		references: [players.id],
	}),
	circuitPhase: one(circuitPhases, {
		fields: [circuitPodiums.circuitPhaseId],
		references: [circuitPhases.id],
	}),
}))

export const insertCircuitPodiumSchema = createInsertSchema(circuitPodiums)

export type CircuitPodium = typeof circuitPodiums.$inferSelect
export type NewCircuitPodium = typeof circuitPodiums.$inferInsert
