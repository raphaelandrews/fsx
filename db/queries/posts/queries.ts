import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { posts } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

export const getPosts = unstable_cache(
	() =>
		db
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
			.execute(),
	["posts"],
	{
		revalidate: 60 * 60 * 24 * 15,
		tags: ["posts"],
	}
)
