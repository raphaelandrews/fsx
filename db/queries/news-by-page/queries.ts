import { desc, eq, count } from "drizzle-orm"

import { db } from "@/db"
import { posts } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache";

const perPage = 12

export const getNewsByPage = unstable_cache(
  async (page: number) => {
    const validPage = Math.max(1, page)

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

    const [{ value: total }] = await db.select({ value: count() }).from(posts).where(eq(posts.published, true))

    const totalItems = total ?? 0
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

    return {
      news: data.map((item) => ({
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
  },
  ["news-list"],
  {
    revalidate: 60 * 60 * 24 * 30, 
    tags: ["news", "news-list"],
  },
)

export async function revalidateNewsList() {
  "use server"
  const { revalidateTag } = await import("next/cache")
  revalidateTag("news-list")
}
