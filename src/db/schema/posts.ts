import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { profiles } from "./index";

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 80 }).notNull(),
  image: text("image").notNull(),
  content: text("content").notNull(),
  slug: text("slug").unique().notNull(),
  authorId: text("author_id").notNull().references(() => profiles.id),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  profile: one(profiles, {
    fields: [posts.authorId],
    references: [profiles.id],
  }),
}));

export const insertPostSchema = createInsertSchema(posts)

export type posts = typeof posts.$inferSelect
export type Newposts = typeof posts.$inferInsert
