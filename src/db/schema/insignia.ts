import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgTable, serial, smallint, varchar } from "drizzle-orm/pg-core";

import { playersToInsignias } from "./index";

export const insignias = pgTable("insignias", {
  id: serial("id").primaryKey(),
  insignia: varchar("insignia", { length: 80 }).notNull().unique(),
  level: smallint("level").notNull(),
});

export const playerInsigniaRelations = relations(insignias, ({ many }) => ({
  playersToInsignia: many(playersToInsignias),
}));

export const insertInsigniaSchema = createInsertSchema(insignias)

export type Insignia = typeof insignias.$inferSelect
export type NewInsignia = typeof insignias.$inferInsert
