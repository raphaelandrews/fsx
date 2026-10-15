import { eq, and } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { posts } from "@/db/schema"

export async function getPostBySlug(slug: string) {
	"use cache"
	cacheTag("posts", `post-${slug}`)
	cacheLife("weeks")

	return db.query.posts.findFirst({
		where: and(eq(posts.slug, slug), eq(posts.published, true)),
		columns: {
			id: true,
			title: true,
			image: true,
			content: true,
			slug: true,
			createdAt: true,
		},
	})
}
