import { desc, count } from "drizzle-orm"

import { db } from "@/db"
import { announcements } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

const perPage = 12

export const getAnnouncementsByPage = (page: number) => {
	const validPage = Math.max(1, page)

	return unstable_cache(
		async () => {
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
		},
		["get-announcements-by-page", String(validPage)],
		{
			revalidate: 60 * 60 * 24 * 15,
			tags: ["announcements", "announcements-by-page", `announcements-page-${validPage}`],
		}
	)
}
