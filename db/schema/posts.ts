import { createInsertSchema } from "drizzle-zod"
import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 80 }).notNull(),
  image: text("image").notNull(),
  content: text("content").notNull(),
  slug: text("slug").unique().notNull(),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts)

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
