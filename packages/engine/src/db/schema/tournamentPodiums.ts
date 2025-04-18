import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, smallint, uniqueIndex } from "drizzle-orm/pg-core";

import { players, tournaments } from "./index";

export const tournamentPodiums = pgTable("tournament_podiums", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  place: smallint("place").notNull()
},
  (t) => [
    uniqueIndex("player_tournament_podium").on(t.playerId, t.tournamentId),
  ],
);

export const tournamentPodiumsRelations = relations(tournamentPodiums, ({ one }) => ({
  player: one(players, {
    fields: [tournamentPodiums.playerId],
    references: [players.id],
  }),
  tournament: one(tournaments, {
    fields: [tournamentPodiums.tournamentId],
    references: [tournaments.id],
  }),
}));

export const insertTournamentPodiumSchema = createInsertSchema(tournamentPodiums)