import { eq, and } from "drizzle-orm"

import { db } from "@/db"
import { posts } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

export const getPostBySlug = (slug: string) => {
	return unstable_cache(
		async () =>
			db.query.posts.findFirst({
				where: and(eq(posts.slug, slug), eq(posts.published, true)),
				columns: {
					id: true,
					title: true,
					image: true,
					content: true,
					slug: true,
					createdAt: true,
				},
			}),
		["get-post-by-slug"],
		{
			revalidate: 60 * 60 * 24 * 15,
			tags: ["posts", `post-${slug}`],
		}
	)
}
