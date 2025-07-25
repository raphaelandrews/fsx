import { asc } from "drizzle-orm"

import { db } from "@/db"
import { events } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

export const getEvents = unstable_cache(
	() =>
		db.select().from(events).orderBy(asc(events.startDate)).limit(4).execute(),
	["events"],
	{
		revalidate: 60 * 60 * 24 * 15,
		tags: ["events"],
	}
)
