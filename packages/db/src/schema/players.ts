import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { circuitPodiums, cupPlayers, clubs, defendingChampions, locations, playersToRoles, playersToTournaments, playersToNorms, tournamentPodiums, cupMatches, cupGames, playersToInsignias, tvSergipe } from "./index"
import { playersToTitles } from "./playersToTitles"

export const players = sqliteTable(
	"players",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull(),
		normalizedName: text("normalized_name"),
		nickname: text("nickname").unique(),
		blitz: integer("blitz").notNull().default(1900),
		rapid: integer("rapid").notNull().default(1900),
		classic: integer("classic").notNull().default(1900),
		active: integer("active", { mode: "boolean" }).default(false).notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
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
		// Group/age filters combine `active = true` with a birth_date range.
		index("players_active_birth_date_idx").on(table.active, table.birthDate),
		// Rating sorts (top-players, /ratings, /titulados) scan the whole table
		// without these; the index lets ORDER BY + LIMIT avoid a full scan.
		index("players_classic_idx").on(table.classic),
		index("players_rapid_idx").on(table.rapid),
		index("players_blitz_idx").on(table.blitz),
		// `WHERE active = true ORDER BY <rating> LIMIT n` is the hot path for the
		// command-menu default list, top-players and /ratings. The composite lets
		// the planner walk the index in order and stop at LIMIT instead of
		// scanning every active row and sorting it in a temp B-tree.
		index("players_active_classic_idx").on(table.active, table.classic),
		index("players_active_rapid_idx").on(table.active, table.rapid),
		index("players_active_blitz_idx").on(table.active, table.blitz),
		// Admin players list orders by name for pagination.
        index("players_name_idx").on(table.name),
        check("players_rating_range_check", sql`${table.blitz} BETWEEN 0 AND 4000 AND ${table.rapid} BETWEEN 0 AND 4000 AND ${table.classic} BETWEEN 0 AND 4000`),
        check("players_sex_check", sql`${table.sex} IN ('male', 'female')`),
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
