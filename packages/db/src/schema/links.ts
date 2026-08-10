import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { linkGroups } from "./index"

export const links = sqliteTable("links", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	href: text("href").notNull(),
	label: text("label").notNull(),
	icon: text("icon").notNull(),
	order: integer("order").notNull(),
	linkGroupId: integer("link_group_id").references(() => linkGroups.id, { onDelete: "cascade" }).notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
})

export const linksRelations = relations(links, ({ one }) => ({
	linkGroup: one(linkGroups, { fields: [links.linkGroupId], references: [linkGroups.id] }),
}))

export const insertLinkSchema = createInsertSchema(links)
export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
