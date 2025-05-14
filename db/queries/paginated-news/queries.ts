import { desc, eq, count } from 'drizzle-orm';

import { db } from "@/db";
import { posts } from "@/db/schema";
import { unstable_cache } from "@/lib/unstable_cache";

const perPage = 12;

export const getNews = unstable_cache(
  async (page: number) => {
    const news = await db.query.posts.findMany({
      columns: {
        id: true,
        title: true,
        image: true,
        slug: true,
        createdAt: true
      },
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    const [{ value: total }] = await db.select({ value: count() })
      .from(posts)
      .where(eq(posts.published, true));

    const totalItems = total ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

    return {
      news: news.map(item => ({
        ...item,
        createdAt: item.createdAt?.toISOString() ?? null,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: perPage,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  },
  ['news'],
  {
    revalidate: 60 * 60 * 24 * 30,
  }
);