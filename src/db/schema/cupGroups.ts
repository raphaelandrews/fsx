import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, smallint, varchar } from "drizzle-orm/pg-core"

import { cups, cupPlayers, cupRounds } from "./index";

export const cupGroups = pgTable("cup_groups", {
  id: serial("id").primaryKey(),
  cupId: integer("cup_id")
    .notNull()
    .references(() => cups.id),
  name: varchar("name", { length: 100 }).notNull(),
  order: smallint("order").notNull(),
});

export const cupGroupsRelations = relations(cupGroups, ({ one, many }) => ({
  cup: one(cups, {
    fields: [cupGroups.cupId],
    references: [cups.id],
  }),
  cupPlayers: many(cupPlayers),
  cupRounds: many(cupRounds),
}));

export const insertCupGroupSchema = createInsertSchema(cupGroups)

export type CupGroup = typeof cupGroups.$inferSelect
export type NewCupGroup = typeof cupGroups.$inferInsert
