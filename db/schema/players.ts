import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { boolean, date, integer, pgTable, serial, smallint, text, timestamp, varchar } from "drizzle-orm/pg-core";

import {
  circuitPodiums,
  cupPlayers,
  clubs,
  defendingChampions,
  locations,
  playersToRoles,
  playersToTournaments,
  playersToNorms,
  tournamentPodiums,
  cupMatches,
  cupGames,
  playersToInsignias,
} from "./index";
import { playersToTitles } from "./playersToTitles";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nickname: varchar("nickname", { length: 20 }).unique(),
  blitz: smallint("blitz").notNull().default(1900),
  rapid: smallint("rapid").notNull().default(1900),
  classic: smallint("classic").notNull().default(1900),
  active: boolean("active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  description: text("description"),
  imageUrl: text("image_url"),
  cbxId: integer("cbx_id"),
  fideId: integer("fide_id"),
  verified: boolean("verified").default(false),
  birth: date('birth', { mode: "date" }),
  sex: boolean("sex").default(false),
  clubId: integer("club_id").references(() => clubs.id),
  locationId: integer("location_id").references(() => locations.id),
});

export const playersRelations = relations(players, ({ one, many }) => ({
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  location: one(locations, {
    fields: [players.locationId],
    references: [locations.id],
  }),
  circuitPodiums: many(circuitPodiums),
  cupGames: many(cupGames),
  cupMatches: many(cupMatches),
  cupPlayers: many(cupPlayers),
  defendingChampions: many(defendingChampions),
  playersToInsignia: many(playersToInsignias),
  playersToNorms: many(playersToNorms),
  playersToRoles: many(playersToRoles),
  playersToTitles: many(playersToTitles),
  playersToTournaments: many(playersToTournaments),
  tournamentPodiums: many(tournamentPodiums),
}));

export const insertPlayerSchema = createInsertSchema(players)

export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
