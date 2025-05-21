import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { links } from "./index";

export const linkGroups = pgTable("link_groups", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
});

export const linkGroupsRelations = relations(linkGroups, ({ many }) => ({
  links: many(links),
}));

export const insertLinkGroupSchema = createInsertSchema(linkGroups)

export type LinkGroup = typeof linkGroups.$inferSelect
export type NewLinkGroup = typeof linkGroups.$inferInsert
