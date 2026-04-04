import { asc } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { events } from "@/db/schema"

export async function getEvents() {
	"use cache"
	cacheTag("events")
	cacheLife("weeks")

	return db.select().from(events).orderBy(asc(events.startDate)).limit(4).execute()
}
