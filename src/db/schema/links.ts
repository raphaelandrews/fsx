import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, smallint, text, varchar } from "drizzle-orm/pg-core";

import { linkGroups } from "./index";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  href: text("href").notNull(),
  label: varchar("label", {length: 50}).notNull(),
  icon: text("icon").notNull(),
  order: smallint("order").notNull(),
  linkGroupId: integer("link_group_id").references(() => linkGroups.id).notNull(),
});

export const linksRelations = relations(links, ({ one }) => ({
  linkGroup: one(linkGroups, {
    fields: [links.linkGroupId],
    references: [linkGroups.id],
  }),
}));

export const insertLinkSchema = createInsertSchema(links);

export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
