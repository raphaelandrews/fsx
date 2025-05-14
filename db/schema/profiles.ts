import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { posts } from "./index";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  updatedAt: timestamp("updated_at"),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url").notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
}));

export const insertProfileSchema = createInsertSchema(profiles)
