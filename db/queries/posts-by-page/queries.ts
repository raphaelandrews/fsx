import { desc, eq, count } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { posts } from "@/db/schema"

const perPage = 12

export async function getPostsByPage(page: number) {
	"use cache"
	const validPage = Math.max(1, page)
	cacheTag("posts", "posts-by-page", `posts-page-${validPage}`)
	cacheLife("weeks")

	const data = await db.query.posts.findMany({
		columns: {
			id: true,
			title: true,
			image: true,
			slug: true,
			createdAt: true,
		},
		where: eq(posts.published, true),
		orderBy: [desc(posts.createdAt)],
		limit: perPage,
		offset: (validPage - 1) * perPage,
	})

	const [{ value: total }] = await db
		.select({ value: count() })
		.from(posts)
		.where(eq(posts.published, true))

	const totalItems = total ?? 0
	const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

	return {
		posts: data.map((item) => ({
			...item,
			createdAt: item.createdAt?.toISOString() ?? null,
		})),
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
