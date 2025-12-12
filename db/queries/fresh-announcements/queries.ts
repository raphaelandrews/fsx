import { desc } from "drizzle-orm"

import { db } from "@/db"
import { announcements } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

export const getFreshAnnouncements = unstable_cache(
	() =>
		db
			.select({
				id: announcements.id,
				year: announcements.year,
				number: announcements.number,
				content: announcements.content,
			})
			.from(announcements)
			.orderBy(desc(announcements.year), desc(announcements.number))
			.limit(8)
			.execute(),
	["get-fresh-announcements"],
	{
		revalidate: 60 * 60 * 24 * 15,
		tags: ["announcements", "fresh-announcements"],
	}
)
