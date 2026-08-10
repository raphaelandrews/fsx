import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { playersToRoles } from "./index"

export const roles = sqliteTable("roles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	role: text("role").notNull().unique(),
	shortRole: text("short_role").notNull().unique(),
	type: text("type").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
})

export const rolesRelations = relations(roles, ({ many }) => ({
	playersToRoles: many(playersToRoles),
}))

export const insertRoleSchema = createInsertSchema(roles)
export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
