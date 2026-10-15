import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { linkGroups } from "./index"

export const links = sqliteTable(
	"links",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		// Null = link announced but the URL isn't available yet ("em breve"),
		// e.g. a regulation that will be published before the event.
		href: text("href"),
		label: text("label").notNull(),
		icon: text("icon").notNull(),
		// Event-owned links are one of the three recurring event link types
		// (Regulamento / Formulário / Chess-Results). Directory links default to
		// "link" and aren't restricted to the event types.
		type: text("type").notNull().default("link"),
		sortOrder: integer("sort_order").notNull(),
		linkGroupId: integer("link_group_id").references(() => linkGroups.id, { onDelete: "cascade" }).notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("links_link_group_id_idx").on(table.linkGroupId),
		check("links_type_check", sql`${table.type} IN ('link', 'regulation', 'form', 'results')`),
	],
)

export const linksRelations = relations(links, ({ one }) => ({
	linkGroup: one(linkGroups, { fields: [links.linkGroupId], references: [linkGroups.id] }),
}))

export const insertLinkSchema = createInsertSchema(links)
export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
