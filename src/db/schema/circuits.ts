import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { circuitPhases } from "./index";

export const circuitTypeEnum = pgEnum('circuit_type', ['default', 'categories', 'school']);

export const circuits = pgTable("circuits", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  type: circuitTypeEnum("type").notNull(),
});

export const circuitsRelations = relations(circuits, ({ many }) => ({
  circuitPhase: many(circuitPhases),
}));

export const insertCircuitSchema = createInsertSchema(circuits)

export type Circuit = typeof circuits.$inferSelect
export type NewCircuit = typeof circuits.$inferInsert
