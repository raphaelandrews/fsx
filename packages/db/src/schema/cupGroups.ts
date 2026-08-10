import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { cups, cupPlayers, cupRounds } from "./index"

export const cupGroups = sqliteTable("cup_groups", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	cupId: integer("cup_id").notNull().references(() => cups.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	order: integer("order").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
})

export const cupGroupsRelations = relations(cupGroups, ({ one, many }) => ({
	cup: one(cups, { fields: [cupGroups.cupId], references: [cups.id] }),
	cupPlayers: many(cupPlayers),
	cupRounds: many(cupRounds),
}))

export const insertCupGroupSchema = createInsertSchema(cupGroups)
export type CupGroup = typeof cupGroups.$inferSelect
export type NewCupGroup = typeof cupGroups.$inferInsert
