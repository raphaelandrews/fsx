import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

// Results too expensive to compute per request on the Workers free plan
// (records, club standings), stored as JSON. `computed_at` is when the
// computation started, in milliseconds; the `data_changed` row holds when an
// admin mutation last changed the data, so older results are recomputed.
export const computedResults = sqliteTable("computed_results", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
	computedAt: integer("computed_at").notNull(),
})

export type ComputedResult = typeof computedResults.$inferSelect
