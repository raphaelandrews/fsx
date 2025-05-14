import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, smallint, text } from "drizzle-orm/pg-core"

import { players, cupMatches } from "./index";

export const cupGames = pgTable("cup_games", {
  id: serial("id").primaryKey(),
  winnerId: integer("winner_id")
    .references(() => players.id),
  cupMatchId: integer("cup_match_id")
    .notNull()
    .references(() => cupMatches.id),
  gameNumber: smallint("game_number").notNull(),
  link: text("link"),
});

export const cupGameRelations = relations(cupGames, ({ one }) => ({
  winnerId: one(players, {
    fields: [cupGames.winnerId],
    references: [players.id],
  }),
  cupMatch: one(cupMatches, {
    fields: [cupGames.cupMatchId],
    references: [cupMatches.id],
  }),
}));

export const insertCupGameSchema = createInsertSchema(cupGames)
