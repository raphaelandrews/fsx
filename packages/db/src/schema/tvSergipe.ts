import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { clubs, players } from "./index"

export const AGE_GROUPS = ["8", "10", "12", "14", "16", "18"] as const

/** Suffixes that disambiguate multiple teams from the same school in a category. */
export const TEAM_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const

export const PLACE_POINTS: Record<number, number> = {
  1: 10,
  2: 8,
  3: 6,
  4: 5,
  5: 4,
  6: 3,
  7: 2,
  8: 1,
}

export const TEAM_MEDAL_WEIGHT = 2
export const INDIVIDUAL_MEDAL_WEIGHT = 1

// A team result credits 2 medals of its type; individual credits 1. Points stay 1x per placement.
export const tvSergipe = sqliteTable(
  "tv_sergipe",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "restrict" }),
    playerId: integer("player_id").references(() => players.id, { onDelete: "set null" }),
    teamName: text("team_name"),
    ageGroup: text("age_group").notNull(),
    sex: text("sex").notNull(),
    modality: text("modality").notNull(),
    place: integer("place").notNull(),
    points: integer("points").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => ({
    ageSexModalityIdx: index("tv_sergipe_age_sex_modality_idx").on(t.ageGroup, t.sex, t.modality),
    clubAgeIdx: index("tv_sergipe_club_age_idx").on(t.clubId, t.ageGroup),
    // NULL-distinct in SQLite means team rows (playerId NULL) and individual rows (teamName NULL) don't collide.
    individualUnique: uniqueIndex("tv_sergipe_individual_unique_idx").on(t.playerId, t.ageGroup, t.sex),
    // A school can't field two teams with the same suffix in the same category.
    teamUnique: uniqueIndex("tv_sergipe_team_unique_idx").on(t.clubId, t.ageGroup, t.sex, t.teamName),
    teamNameCheck: check("tv_sergipe_team_name_check", sql`"team_name" IS NULL OR "team_name" IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J')`),
    ageGroupCheck: check("tv_sergipe_age_group_check", sql`${t.ageGroup} IN ('8', '10', '12', '14', '16', '18')`),
    sexCheck: check("tv_sergipe_sex_check", sql`${t.sex} IN ('male', 'female')`),
    modalityCheck: check("tv_sergipe_modality_check", sql`${t.modality} IN ('individual', 'team')`),
    placePointsCheck: check("tv_sergipe_place_points_check", sql`${t.place} BETWEEN 1 AND 8 AND ${t.points} BETWEEN 1 AND 10`),
    participantCheck: check("tv_sergipe_participant_check", sql`(${t.modality} = 'individual' AND ${t.playerId} IS NOT NULL AND ${t.teamName} IS NULL) OR (${t.modality} = 'team' AND ${t.playerId} IS NULL AND ${t.teamName} IS NOT NULL)`),
  })
)

export const tvSergipeRelations = relations(tvSergipe, ({ one }) => ({
  club: one(clubs, { fields: [tvSergipe.clubId], references: [clubs.id] }),
  player: one(players, { fields: [tvSergipe.playerId], references: [players.id] }),
}))

export const insertTvSergipeSchema = createInsertSchema(tvSergipe)
export type TvSergipeResult = typeof tvSergipe.$inferSelect
export type NewTvSergipeResult = typeof tvSergipe.$inferInsert
