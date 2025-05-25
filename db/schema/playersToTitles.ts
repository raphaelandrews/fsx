import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, uniqueIndex, } from "drizzle-orm/pg-core";

import { players, titles } from "./index";

export const playersToTitles = pgTable("players_to_titles", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  titleId: integer("title_id")
    .notNull()
    .references(() => titles.id),
},
  (t) => [
    uniqueIndex("player_title").on(t.playerId, t.titleId),
  ],
);

export const playersToTitlesRelations = relations(playersToTitles, ({ one }) => ({
  player: one(players, {
    fields: [playersToTitles.playerId],
    references: [players.id],
  }),
  title: one(titles, {
    fields: [playersToTitles.titleId],
    references: [titles.id],
  }),
}));

export const insertPlayerToTitleSchema = createInsertSchema(playersToTitles);

export type PlayerToTitle = typeof playersToTitles.$inferSelect
export type NewPlayerToTitle = typeof playersToTitles.$inferInsert
