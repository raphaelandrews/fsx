import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { playersToNorms } from "./index";

export const norms = pgTable("norms", {
  id: serial("id").primaryKey(),
  norm: varchar("norm", { length: 80 }).notNull().unique(),
});

export const playerNormsRelations = relations(norms, ({ many }) => ({
  playersToNorms: many(playersToNorms),
}));

export const insertNormSchema = createInsertSchema(norms)

export type Norm = typeof norms.$inferSelect
export type NewNorm = typeof norms.$inferInsert
