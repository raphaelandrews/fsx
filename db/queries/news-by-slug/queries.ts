import { eq, and } from "drizzle-orm"

import { db } from "@/db"
import { posts } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache";

export const getNewsBySlug = unstable_cache(
  (slug: string) => db.query.posts.findFirst({
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
  ["news-item"],
  {
    revalidate: 60 * 60 * 24 * 30,
    tags: ["news", "news-item"],
  },
)
