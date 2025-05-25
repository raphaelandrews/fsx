import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, uniqueIndex } from "drizzle-orm/pg-core";

import { championships, players } from "./index";

export const defendingChampions = pgTable("defending_champions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  championshipId: integer("championship_id")
    .notNull()
    .references(() => championships.id),
},
  (t) => [
    uniqueIndex("defending_champion").on(t.playerId, t.championshipId),
  ],
);

export const defendingChampionsRelations = relations(defendingChampions, ({ one }) => ({
  player: one(players, {
    fields: [defendingChampions.playerId],
    references: [players.id],
  }),
  championship: one(championships, {
    fields: [defendingChampions.championshipId],
    references: [championships.id],
  }),
}));

export const insertDefendingChampionSchema = createInsertSchema(defendingChampions);

export type DefendingChampion = typeof defendingChampions.$inferSelect
export type NewDefendingChampion = typeof defendingChampions.$inferInsert
