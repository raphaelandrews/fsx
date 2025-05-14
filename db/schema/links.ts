import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, smallint, text, varchar } from "drizzle-orm/pg-core";

import { linksGroups } from "./index";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  href: text("href").notNull(),
  label: varchar("label", {length: 50}).notNull(),
  icon: text("icon").notNull(),
  order: smallint("order").notNull(),
  linkGroupId: integer("link_group_id").references(() => linksGroups.id).notNull(),
});

export const linksRelations = relations(links, ({ one }) => ({
  linkGroup: one(linksGroups, {
    fields: [links.linkGroupId],
    references: [linksGroups.id],
  }),
}));

export const insertLinkSchema = createInsertSchema(links);
