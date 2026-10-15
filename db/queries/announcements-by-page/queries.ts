import { desc, count } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { announcements } from "@/db/schema"

const perPage = 12

export async function getAnnouncementsByPage(page: number) {
	"use cache"
	const validPage = Math.max(1, page)
	cacheTag("announcements", "announcements-by-page", `announcements-page-${validPage}`)
	cacheLife("weeks")

	const data = await db.query.announcements.findMany({
		columns: { id: true, year: true, number: true, content: true },
		orderBy: [desc(announcements.year), desc(announcements.number)],
		limit: perPage,
		offset: (validPage - 1) * perPage,
	})

	const [{ value: total }] = await db
		.select({ value: count() })
		.from(announcements)
	const totalItems = total ?? 0
	const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

	return {
		announcements: data,
		pagination: {
			currentPage: validPage,
			totalPages,
			totalItems,
			itemsPerPage: perPage,
			hasNextPage: validPage < totalPages,
			hasPreviousPage: validPage > 1,
		},
	}
}
