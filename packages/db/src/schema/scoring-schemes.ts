import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

// A reusable place -> points table. Circuits and tournaments point at one; entry forms prefill
// points from it. Results always store their own points, so changing or replacing a scheme never
// rewrites history and ties or overrides stay possible.
export const scoringSchemes = sqliteTable("scoring_schemes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const scoringSchemePlaces = sqliteTable(
	"scoring_scheme_places",
	{
		schemeId: integer("scheme_id").notNull().references(() => scoringSchemes.id, { onDelete: "cascade" }),
		place: integer("place").notNull(),
		points: integer("points").notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.schemeId, t.place] }),
		check("scoring_scheme_places_place_check", sql`${t.place} BETWEEN 1 AND 1000`),
		check("scoring_scheme_places_points_check", sql`${t.points} BETWEEN 0 AND 1000000`),
	],
)

export const scoringSchemesRelations = relations(scoringSchemes, ({ many }) => ({
	places: many(scoringSchemePlaces),
}))

export const scoringSchemePlacesRelations = relations(scoringSchemePlaces, ({ one }) => ({
	scheme: one(scoringSchemes, { fields: [scoringSchemePlaces.schemeId], references: [scoringSchemes.id] }),
}))

export const insertScoringSchemeSchema = createInsertSchema(scoringSchemes)
export type ScoringScheme = typeof scoringSchemes.$inferSelect
export type NewScoringScheme = typeof scoringSchemes.$inferInsert
