import { desc, eq} from "drizzle-orm"

import { db } from "@/db"
import { posts } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache";

export const getNews = unstable_cache(
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
  ["news"],
  {
    revalidate: 60 * 60 * 24 * 30,
    tags: ["news"],
  },
)

export async function revalidateAllNews() {
  "use server"
  const { revalidateTag } = await import("next/cache")
  revalidateTag("news")
}
