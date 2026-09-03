import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { linkGroups } from "./index";

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    startDate: text("start_date").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [index("events_start_date_idx").on(table.startDate)],
);

export const eventsRelations = relations(events, ({ one }) => ({
  linkGroup: one(linkGroups, { fields: [events.id], references: [linkGroups.eventId] }),
}));

export const insertEventSchema = createInsertSchema(events);
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
