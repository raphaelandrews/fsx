import { createInsertSchema } from "drizzle-zod"
import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const posts = sqliteTable("posts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	title: text("title").notNull(),
	imageUrl: text("image_url").notNull(),
	content: text("content").notNull(),
	slug: text("slug").unique().notNull(),
	published: integer("published", { mode: "boolean" }).default(false).notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
})

export const insertPostSchema = createInsertSchema(posts)
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
