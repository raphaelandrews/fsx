import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { clubs, players } from "./index"

export const AGE_GROUPS = ["8", "10", "12", "14", "16", "18"] as const

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
export const schoolResults = sqliteTable(
  "school_results",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
    playerId: integer("player_id").references(() => players.id, { onDelete: "set null" }),
    teamName: text("team_name"),
    ageGroup: text("age_group").notNull(),
    sex: text("sex").notNull(),
    modality: text("modality").notNull(),
    place: integer("place").notNull(),
    points: integer("points").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => ({
    ageSexModalityIdx: index("school_results_age_sex_modality_idx").on(t.ageGroup, t.sex, t.modality),
    clubAgeIdx: index("school_results_club_age_idx").on(t.clubId, t.ageGroup),
    // NULL-distinct in SQLite means team rows (playerId NULL) and individual rows (teamName NULL) don't collide.
    individualUnique: uniqueIndex("school_results_individual_unique_idx").on(t.playerId, t.ageGroup, t.sex),
    teamUnique: uniqueIndex("school_results_team_unique_idx").on(t.clubId, t.ageGroup, t.sex, t.teamName),
  })
)

export const schoolResultsRelations = relations(schoolResults, ({ one }) => ({
  club: one(clubs, { fields: [schoolResults.clubId], references: [clubs.id] }),
  player: one(players, { fields: [schoolResults.playerId], references: [players.id] }),
}))

export const insertSchoolResultsSchema = createInsertSchema(schoolResults)
export type SchoolResult = typeof schoolResults.$inferSelect
export type NewSchoolResult = typeof schoolResults.$inferInsert