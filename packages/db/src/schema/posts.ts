import { createInsertSchema } from "drizzle-zod"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const posts = sqliteTable("posts", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	image: text("image").notNull(),
	content: text("content").notNull(),
	slug: text("slug").unique().notNull(),
	published: integer("published", { mode: "boolean" }).default(false),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
})

export const insertPostSchema = createInsertSchema(posts)
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
