import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core"

import { cups, defendingChampions, tournaments } from "./index";

export const championships = pgTable("championships", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
});

export const championshipsRelations = relations(championships, ({ many }) => ({
  cups: many(cups),
  defendingChampions: many(defendingChampions),
  tournaments: many(tournaments),
}));

export const insertChampionshipsSchema = createInsertSchema(championships)
