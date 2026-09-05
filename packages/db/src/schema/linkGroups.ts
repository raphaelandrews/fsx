import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { events, links } from "./index";

export const linkGroups = sqliteTable("link_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  // When set, this group holds the links for an event (regulation, form,
  // results, ...). Null means it's a "directory" group shown on /links.
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export const linkGroupsRelations = relations(linkGroups, ({ many, one }) => ({
  links: many(links),
  event: one(events, { fields: [linkGroups.eventId], references: [events.id] }),
}));

export const insertLinkGroupSchema = createInsertSchema(linkGroups);
export type LinkGroup = typeof linkGroups.$inferSelect;
export type NewLinkGroup = typeof linkGroups.$inferInsert;
