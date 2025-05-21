import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, smallint } from "drizzle-orm/pg-core"

import { cupMatches, cupBrackets } from "./index";

export const phaseTypeEnum = pgEnum('phase_type', ['Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior']);

export const cupPlayoffs = pgTable("cup_playoffs", {
  id: serial("id").primaryKey(),
  cupBracketId: integer("cup_bracket_id")
    .notNull()
    .references(() => cupBrackets.id),
  phaseType: phaseTypeEnum("phase_type").notNull(),
  order: smallint("order").notNull(),
});

export const cupPlayoffsRelations = relations(cupPlayoffs, ({ one, many }) => ({
  cupBracket: one(cupBrackets, {
    fields: [cupPlayoffs.cupBracketId],
    references: [cupBrackets.id],
  }),
  cupMatches: many(cupMatches),
}));

export const insertCupPlayoffSchema = createInsertSchema(cupPlayoffs)

export type CupPlayoff = typeof cupPlayoffs.$inferSelect
export type NewCupPlayoff = typeof cupPlayoffs.$inferInsert
