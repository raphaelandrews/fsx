import { relations, sql } from "drizzle-orm"
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { categories, circuits } from "./index"

// The categories a circuit uses. Empty means any category is accepted; once it has rows, results
// and final podiums of the circuit must use one of them.
export const circuitCategories = sqliteTable(
	"circuit_categories",
	{
		circuitId: integer("circuit_id").notNull().references(() => circuits.id, { onDelete: "cascade" }),
		category: text("category").notNull().references(() => categories.name, { onUpdate: "cascade", onDelete: "restrict" }),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	},
	(t) => [primaryKey({ columns: [t.circuitId, t.category] })],
)

export const circuitCategoriesRelations = relations(circuitCategories, ({ one }) => ({
	circuit: one(circuits, { fields: [circuitCategories.circuitId], references: [circuits.id] }),
}))

export type CircuitCategory = typeof circuitCategories.$inferSelect
