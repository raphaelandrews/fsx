import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPodiums, cupPlayers, clubs, defendingChampions, locations, playersToRoles, playersToTournaments, playersToNorms, tournamentPodiums, cupMatches, cupGames, playersToInsignias, tvSergipe } from "./index"
import { playersToTitles } from "./playersToTitles"

export const players = sqliteTable(
	"players",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull(),
		nickname: text("nickname").unique(),
		blitz: integer("blitz").notNull().default(1900),
		rapid: integer("rapid").notNull().default(1900),
		classic: integer("classic").notNull().default(1900),
		active: integer("active", { mode: "boolean" }).default(false).notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
		description: text("description"),
		imageUrl: text("image_url"),
		cbxId: integer("cbx_id").unique(),
		fideId: integer("fide_id").unique(),
		verified: integer("verified", { mode: "boolean" }).default(false).notNull(),
		birthDate: text("birth_date"),
		sex: text("sex").notNull().default("male"),
		clubId: integer("club_id").references(() => clubs.id),
		locationId: integer("location_id").references(() => locations.id),
	},
	(table) => [
		index("players_active_idx").on(table.active),
		index("players_sex_idx").on(table.sex),
		index("players_club_idx").on(table.clubId),
		index("players_location_idx").on(table.locationId),
	],
)

export const playersRelations = relations(players, ({ one, many }) => ({
	club: one(clubs, { fields: [players.clubId], references: [clubs.id] }),
	location: one(locations, { fields: [players.locationId], references: [locations.id] }),
	circuitPodiums: many(circuitPodiums),
	cupGames: many(cupGames),
	cupMatches: many(cupMatches),
	cupPlayers: many(cupPlayers),
	defendingChampions: many(defendingChampions),
	playersToInsignias: many(playersToInsignias),
	playersToNorms: many(playersToNorms),
	playersToRoles: many(playersToRoles),
	playersToTitles: many(playersToTitles),
	playersToTournaments: many(playersToTournaments),
	tvSergipe: many(tvSergipe),
	tournamentPodiums: many(tournamentPodiums),
}))

export const insertPlayerSchema = createInsertSchema(players)
export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
