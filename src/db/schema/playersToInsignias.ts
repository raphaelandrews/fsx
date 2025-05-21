import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, uniqueIndex } from "drizzle-orm/pg-core";

import { insignias, players } from "./index";

export const playersToInsignias = pgTable("players_to_insignias", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  insigniaId: integer("insignia_id")
    .notNull()
    .references(() => insignias.id),
},
  (t) => [
    uniqueIndex("player_insignia").on(t.playerId, t.insigniaId),
  ],
);

export const playersToInsigniaRelations = relations(playersToInsignias, ({ one }) => ({
  player: one(players, {
    fields: [playersToInsignias.playerId],
    references: [players.id],
  }),
  insignia: one(insignias, {
    fields: [playersToInsignias.insigniaId],
    references: [insignias.id],
  }),
}));

export const insertPlayerToInsigniaSchema = createInsertSchema(playersToInsignias);

export type PlayerToInsignia = typeof playersToInsignias.$inferSelect
export type NewPlayerToInsignia = typeof playersToInsignias.$inferInsert
