import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { date, pgTable, serial, smallint, integer } from "drizzle-orm/pg-core"

import { players, cupGames, cupPlayoffs, cupRounds } from "./index";

export const cupMatches = pgTable("cup_matches", {
  id: serial("id").primaryKey(),
  playerOneId: integer("player_one_id")
    .notNull()
    .references(() => players.id),
  playerTwoId: integer("player_two_id")
    .notNull()
    .references(() => players.id),
  winnerId: integer("winner_id")
    .references(() => players.id),
  cupRoundId: integer("cup_round_id")
    .references(() => cupRounds.id),
  cupPlayoffId: integer("cup_playoff_id")
    .references(() => cupPlayoffs.id),
  bestOf: smallint("best_of").notNull(),
  order: smallint("order").notNull(),
  date: date('date', { mode: "date" }).notNull(),
});

export const cupMatchesRelations = relations(cupMatches, ({ one, many }) => ({
  playerOne: one(players, {
    fields: [cupMatches.playerOneId],
    references: [players.id],
  }),
  playerTwo: one(players, {
    fields: [cupMatches.playerTwoId],
    references: [players.id],
  }),
  winner: one(players, {
    fields: [cupMatches.winnerId],
    references: [players.id],
  }),
  cupRound: one(cupRounds, {
    fields: [cupMatches.cupRoundId],
    references: [cupRounds.id],
  }),
  cupPlayoff: one(cupPlayoffs, {
    fields: [cupMatches.cupPlayoffId],
    references: [cupPlayoffs.id],
  }),
  cupGames: many(cupGames),
}));

export const insertCupMatchSchema = createInsertSchema(cupMatches)