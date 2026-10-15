import { relations, sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { clubs, locations, players } from "./index"

export const UPDATE_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const
export type UpdateRequestStatus = (typeof UPDATE_REQUEST_STATUSES)[number]

// A player's (or their guardian's) proposal to correct or complete their own record.
// Nothing here touches `players` until an administrator approves it; a null column
// means "no change proposed".
export const playerUpdateRequests = sqliteTable(
	"player_update_requests",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("pending"),
		birthYear: integer("birth_year"),
		clubId: integer("club_id").references(() => clubs.id, { onDelete: "set null" }),
		locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
		cbxId: integer("cbx_id"),
		fideId: integer("fide_id"),
		// Private R2 object under `pending/` (never served by /api/media); cleared when the request is decided or deleted.
		photoKey: text("photo_key"),
		reviewNote: text("review_note"),
		reviewedAt: text("reviewed_at"),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		index("player_update_requests_status_idx").on(table.status, table.createdAt),
		index("player_update_requests_player_idx").on(table.playerId, table.status),
		check("player_update_requests_status_check", sql`${table.status} IN ('pending', 'approved', 'rejected')`),
	],
)

export const playerUpdateRequestsRelations = relations(playerUpdateRequests, ({ one }) => ({
	player: one(players, { fields: [playerUpdateRequests.playerId], references: [players.id] }),
	club: one(clubs, { fields: [playerUpdateRequests.clubId], references: [clubs.id] }),
	location: one(locations, { fields: [playerUpdateRequests.locationId], references: [locations.id] }),
}))

export type PlayerUpdateRequest = typeof playerUpdateRequests.$inferSelect
