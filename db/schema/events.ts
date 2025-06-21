import { createInsertSchema } from "drizzle-zod";
import { timestamp, integer, pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const eventTypeEnum = pgEnum('event_type', ['open', 'closed', 'school']);
export const eventTimeControlEnum = pgEnum('event_time_control', ['standard', 'rapid', 'blitz']);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  chessResults: text("chess_results"),
  startDate: timestamp('start_date', { mode: "date" }).notNull(),
  endDate: timestamp('end_date', { mode: "date" }),
  regulation: text("regulation"),
  form: text("form"),
  type: eventTypeEnum("type").notNull(),
  timeControl: eventTimeControlEnum("time_control").notNull(),
});

export const insertEventSchema = createInsertSchema(events);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
