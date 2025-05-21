import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, smallint } from "drizzle-orm/pg-core"

import { cupGroups, cupMatches } from "./index";

export const cupRounds = pgTable("cup_rounds", {
  id: serial("id").primaryKey(),
  cupGroupId: integer("cup_group_id")
    .notNull()
    .references(() => cupGroups.id),
  order: smallint("order").notNull(),
});

export const cupRoundsRelations = relations(cupRounds, ({ one, many }) => ({
  cupGroup: one(cupGroups, {
    fields: [cupRounds.cupGroupId],
    references: [cupGroups.id],
  }),
  cupMatches: many(cupMatches),
}));

export const insertCupRoundSchema = createInsertSchema(cupRounds)

export type CupRound = typeof cupRounds.$inferSelect
export type NewCupRound = typeof cupRounds.$inferInsert
