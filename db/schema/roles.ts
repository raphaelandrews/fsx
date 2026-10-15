import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core"

import { playersToRoles } from "./index"

export const roleTypeEnum = pgEnum("role_type", [
	"management",
	"referee",
	"teacher",
])

export const roles = pgTable("roles", {
	id: serial("id").primaryKey(),
	role: varchar("role", { length: 80 }).notNull().unique(),
	shortRole: varchar("short_role", { length: 4 }).notNull().unique(),
	type: roleTypeEnum("type").notNull(),
})

export const rolesRelations = relations(roles, ({ many }) => ({
	playersToRoles: many(playersToRoles),
}))

export const insertRoleSchema = createInsertSchema(roles)

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
