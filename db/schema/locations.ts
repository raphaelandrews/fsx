import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm";
import { pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core"

import { players } from "./index";

export const locationTypeEnum = pgEnum('location_type', ['city', 'state', 'country']);

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  type: locationTypeEnum('type').notNull(),
  flag: text("flag"),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  players: many(players),
}));

export const insertLocationSchema = createInsertSchema(locations)
