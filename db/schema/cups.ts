import { createInsertSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"
import {
	date,
	integer,
	pgTable,
	serial,
	text,
	varchar,
} from "drizzle-orm/pg-core"

import { championships, cupBrackets, cupGroups } from "./index"

export const cups = pgTable("cups", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 80 }).notNull().unique(),
	imageUrl: text("image_url").notNull(),
	startDate: date("start_date", { mode: "date" }).notNull(),
	endDate: date("end_date", { mode: "date" }).notNull(),
	prizePool: integer("prize_pool").notNull(),
	rhythm: varchar("rhythm", { length: 20 }).notNull(),
	championshipId: integer("championship_id").references(() => championships.id),
})

export const cupRelations = relations(cups, ({ one, many }) => ({
	championship: one(championships, {
		fields: [cups.championshipId],
		references: [championships.id],
	}),
	cupBrackets: many(cupBrackets),
	cupGroups: many(cupGroups),
}))

export const insertCupSchema = createInsertSchema(cups)

export type Cup = typeof cups.$inferSelect
export type NewCup = typeof cups.$inferInsert
