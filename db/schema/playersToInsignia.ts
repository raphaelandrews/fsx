import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, uniqueIndex } from "drizzle-orm/pg-core";

import { insignia, players } from "./index";

export const playersToInsignia = pgTable("players_to_insignia", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  insigniaId: integer("insignia_id")
    .notNull()
    .references(() => insignia.id),
},
  (t) => [
    uniqueIndex("player_insignia").on(t.playerId, t.insigniaId),
  ],
);

export const playersToInsigniaRelations = relations(playersToInsignia, ({ one }) => ({
  player: one(players, {
    fields: [playersToInsignia.playerId],
    references: [players.id],
  }),
  insignia: one(insignia, {
    fields: [playersToInsignia.insigniaId],
    references: [insignia.id],
  }),
}));

export const insertPlayerToInsigniaSchema = createInsertSchema(playersToInsignia);