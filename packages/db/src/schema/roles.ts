import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToRoles } from "./index"

export const roles = sqliteTable("roles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	shortName: text("short_name").notNull().unique(),
	type: text("type").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
	check("roles_type_check", sql`${table.type} IN ('management', 'referee', 'teacher')`),
])

export const rolesRelations = relations(roles, ({ many }) => ({
	playersToRoles: many(playersToRoles),
}))

export const insertRoleSchema = createInsertSchema(roles)
export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
