import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { linkGroups, tournaments } from "./index";

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    venue: text("venue"),
    venueUrl: text("venue_url"),
    tournamentId: integer("tournament_id").references(() => tournaments.id, { onDelete: "set null" }),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [index("events_start_date_idx").on(table.startDate), index("events_tournament_idx").on(table.tournamentId)],
);

export const eventsRelations = relations(events, ({ one }) => ({
  tournament: one(tournaments, { fields: [events.tournamentId], references: [tournaments.id] }),
  linkGroup: one(linkGroups, { fields: [events.id], references: [linkGroups.eventId] }),
}));

export const insertEventSchema = createInsertSchema(events);
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
