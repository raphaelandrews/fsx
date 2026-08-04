import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPodiums, cupPlayers, clubs, defendingChampions, locations, playersToRoles, playersToTournaments, playersToNorms, tournamentPodiums, cupMatches, cupGames, playersToInsignias } from "./index"
import { playersToTitles } from "./playersToTitles"

export const players = sqliteTable("players", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	nickname: text("nickname").unique(),
	blitz: integer("blitz").notNull().default(1900),
	rapid: integer("rapid").notNull().default(1900),
	classic: integer("classic").notNull().default(1900),
	active: integer("active", { mode: "boolean" }).default(false),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	description: text("description"),
	imageUrl: text("image_url"),
	cbxId: integer("cbx_id"),
	fideId: integer("fide_id"),
	verified: integer("verified", { mode: "boolean" }).default(false),
	birth: text("birth"),
	sex: integer("sex", { mode: "boolean" }).notNull().default(false),
	clubId: integer("club_id").references(() => clubs.id),
	locationId: integer("location_id").references(() => locations.id),
})

export const playersRelations = relations(players, ({ one, many }) => ({
	club: one(clubs, { fields: [players.clubId], references: [clubs.id] }),
	location: one(locations, { fields: [players.locationId], references: [locations.id] }),
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
}))

export const insertPlayerSchema = createInsertSchema(players)
export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
