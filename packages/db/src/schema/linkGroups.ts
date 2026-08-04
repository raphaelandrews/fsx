import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { links } from "./index"

export const linkGroups = sqliteTable("link_groups", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	label: text("label").notNull(),
})

export const linkGroupsRelations = relations(linkGroups, ({ many }) => ({
	links: many(links),
}))

export const insertLinkGroupSchema = createInsertSchema(linkGroups)
export type LinkGroup = typeof linkGroups.$inferSelect
export type NewLinkGroup = typeof linkGroups.$inferInsert
