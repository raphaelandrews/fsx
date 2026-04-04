import { desc, eq } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { posts } from "@/db/schema"

export async function getPosts() {
	"use cache"
	cacheTag("posts")
	cacheLife("weeks")

	return db
		.select({
			id: posts.id,
			title: posts.title,
			image: posts.image,
			slug: posts.slug,
		})
		.from(posts)
		.where(eq(posts.published, true))
		.orderBy(desc(posts.createdAt))
		.limit(24)
		.execute()
}
