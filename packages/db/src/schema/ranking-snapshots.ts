import { createInsertSchema } from "drizzle-zod"
import { relations, sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { players } from "./index"

// Active players' ranking position per rating type, captured after each rating
// import, so position changes can be shown later. Derived data, hence cascade.
export const rankingSnapshots = sqliteTable(
	"ranking_snapshots",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
		ratingType: text("rating_type").notNull(),
		position: integer("position").notNull(),
		rating: integer("rating").notNull(),
		snapshotAt: text("snapshot_at").notNull(),
	},
	(t) => [
		index("ranking_snapshots_player_type_at_idx").on(t.playerId, t.ratingType, t.snapshotAt),
		index("ranking_snapshots_type_at_idx").on(t.ratingType, t.snapshotAt),
		check("ranking_snapshots_rating_type_check", sql`${t.ratingType} IN ('blitz', 'rapid', 'classic')`),
		check("ranking_snapshots_position_check", sql`${t.position} >= 1`),
	],
)

export const rankingSnapshotsRelations = relations(rankingSnapshots, ({ one }) => ({
	player: one(players, { fields: [rankingSnapshots.playerId], references: [players.id] }),
}))

export const insertRankingSnapshotSchema = createInsertSchema(rankingSnapshots)
export type RankingSnapshot = typeof rankingSnapshots.$inferSelect
export type NewRankingSnapshot = typeof rankingSnapshots.$inferInsert
