import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, smallint, varchar } from "drizzle-orm/pg-core";

import { players, cupGroups } from "./index";

export const cupPlayers = pgTable("cup_players", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  cupGroupId: integer("cup_group_id")
    .notNull()
    .references(() => cupGroups.id),
  nickname: varchar("nickname", { length: 40 }).unique(),
  position: smallint("position"),
});

export const cupPlayersRelations = relations(cupPlayers, ({ one }) => ({
  player: one(players, {
    fields: [cupPlayers.playerId],
    references: [players.id],
  }),
  cupGroup: one(cupGroups, {
    fields: [cupPlayers.cupGroupId],
    references: [cupGroups.id],
  }),
}));

export const insertCupPlayerSchema = createInsertSchema(cupPlayers);

export type CupPlayer = typeof cupPlayers.$inferSelect
export type NewCupPlayer = typeof cupPlayers.$inferInsert
