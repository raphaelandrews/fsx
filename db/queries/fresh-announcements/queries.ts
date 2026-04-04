import { desc } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { announcements } from "@/db/schema"

export async function getFreshAnnouncements() {
	"use cache"
	cacheTag("announcements", "fresh-announcements")
	cacheLife("weeks")

	return db
		.select({
			id: announcements.id,
			year: announcements.year,
			number: announcements.number,
			content: announcements.content,
		})
		.from(announcements)
		.orderBy(desc(announcements.year), desc(announcements.number))
		.limit(8)
		.execute()
}
