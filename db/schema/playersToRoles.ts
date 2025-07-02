import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, pgTable, serial, uniqueIndex } from "drizzle-orm/pg-core"

import { players, roles } from "./index"

export const playersToRoles = pgTable(
	"players_to_roles",
	{
		id: serial("id").primaryKey(),
		playerId: integer("player_id")
			.notNull()
			.references(() => players.id),
		roleId: integer("role_id")
			.notNull()
			.references(() => roles.id),
	},
	(t) => [uniqueIndex("player_role").on(t.playerId, t.roleId)]
)

export const playersToRolesRelations = relations(playersToRoles, ({ one }) => ({
	player: one(players, {
		fields: [playersToRoles.playerId],
		references: [players.id],
	}),
	role: one(roles, {
		fields: [playersToRoles.roleId],
		references: [roles.id],
	}),
}))

export const insertPlayerToRoleSchema = createInsertSchema(playersToRoles)

export type PlayerToRole = typeof playersToRoles.$inferSelect
export type NewPlayerToRole = typeof playersToRoles.$inferInsert
