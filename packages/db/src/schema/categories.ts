import { createInsertSchema } from "drizzle-zod"
import { sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

// Competition categories as data, so a new one is a row and not a migration. Podium and result
// tables reference `name` (unique, ON UPDATE CASCADE renames it everywhere). An "age" category
// ("Sub 10 Feminino") has a sex and an age limit that School Games results map onto; an "open"
// one (Futuro, Juvenil, Master) has neither.
export const categories = sqliteTable(
	"categories",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull().unique(),
		kind: text("kind").notNull(),
		sex: text("sex"),
		ageLimit: integer("age_limit"),
		sortOrder: integer("sort_order").notNull(),
		createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
		updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(t) => [
		check("categories_kind_check", sql`${t.kind} IN ('age', 'open')`),
		check(
			"categories_shape_check",
			sql`(${t.kind} = 'open' AND ${t.sex} IS NULL AND ${t.ageLimit} IS NULL) OR (${t.kind} = 'age' AND ${t.sex} IN ('male', 'female') AND ${t.ageLimit} BETWEEN 1 AND 100)`,
		),
	],
)

export const insertCategorySchema = createInsertSchema(categories)
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
