import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { profiles } from "./index";

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 80 }).notNull(),
  image: text("image"),
  content: text("content"),
  slug: text("slug").unique(),
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
