import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { players, roles } from "./index"

export const playersToRoles = sqliteTable("players_to_roles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
	roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (t) => [uniqueIndex("player_role").on(t.playerId, t.roleId)])

export const playersToRolesRelations = relations(playersToRoles, ({ one }) => ({
	player: one(players, { fields: [playersToRoles.playerId], references: [players.id] }),
	role: one(roles, { fields: [playersToRoles.roleId], references: [roles.id] }),
}))

export const insertPlayerToRoleSchema = createInsertSchema(playersToRoles)
export type PlayerToRole = typeof playersToRoles.$inferSelect
export type NewPlayerToRole = typeof playersToRoles.$inferInsert
