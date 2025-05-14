import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgTable, serial, smallint, varchar } from "drizzle-orm/pg-core";

import { playersToInsignia } from "./index";

export const insignia = pgTable("insignia", {
  id: serial("id").primaryKey(),
  insignia: varchar("insignia", { length: 80 }).notNull().unique(),
  level: smallint("level").notNull(),
});

export const playerInsigniaRelations = relations(insignia, ({ many }) => ({
  playersToInsignia: many(playersToInsignia),
}));

export const insertInsigniaSchema = createInsertSchema(insignia)
