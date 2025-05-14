import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { links } from "./index";

export const linksGroups = pgTable("links_groups", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
});

export const linksGroupsRelations = relations(linksGroups, ({ many }) => ({
  links: many(links),
}));

export const insertLinkGroupSchema = createInsertSchema(linksGroups)
