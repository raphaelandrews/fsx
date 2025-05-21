import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial } from "drizzle-orm/pg-core"

import { cups, cupPlayoffs } from "./index";

export const bracketTypeEnum = pgEnum('bracket_type', ['UB', 'LB', 'GF']);

export const cupBrackets = pgTable("cup_brackets", {
  id: serial("id").primaryKey(),
  cupId: integer("cup_id")
    .notNull()
    .references(() => cups.id),
  bracketType: bracketTypeEnum("bracket_type").notNull(),
});

export const cupBracketsRelations = relations(cupBrackets, ({ one, many }) => ({
  cup: one(cups, {
    fields: [cupBrackets.cupId],
    references: [cups.id],
  }),
  cupPlayoffs: many(cupPlayoffs),
}));

export const insertCupBracketSchema = createInsertSchema(cupBrackets)

export type CupBracket = typeof cupBrackets.$inferSelect
export type NewCupBracket = typeof cupBrackets.$inferInsert
