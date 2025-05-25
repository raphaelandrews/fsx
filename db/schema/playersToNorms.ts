import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, uniqueIndex } from "drizzle-orm/pg-core";

import { norms, players } from "./index";

export const playersToNorms = pgTable("players_to_norms", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  normId: integer("norm_id")
    .notNull()
    .references(() => norms.id),
},
  (t) => [
    uniqueIndex("player_norm").on(t.playerId, t.normId),
  ],
);

export const playersToNormsRelations = relations(playersToNorms, ({ one }) => ({
  player: one(players, {
    fields: [playersToNorms.playerId],
    references: [players.id],
  }),
  norm: one(norms, {
    fields: [playersToNorms.normId],
    references: [norms.id],
  }),
}));

export const insertPlayerToNormSchema = createInsertSchema(playersToNorms);

export type PlayerToNorm = typeof playersToNorms.$inferSelect
export type NewPlayerToNorm = typeof playersToNorms.$inferInsert
