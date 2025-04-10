import { db } from "@/db";
import { unstable_cache } from "./unstable-cache";
import { count, desc, eq } from "drizzle-orm";
import { posts } from "@/db/schema";

export const getSearchPlayers = unstable_cache(
  () =>
    db.query.players.findMany({
      columns: {
        id: true,
        name: true,
      },
    }),
  ["search-players"],
  {
    revalidate: 60 * 60 * 2,
  },
);

export const getFreshNews = unstable_cache(
  () =>
    db.query.posts.findMany({
      columns: {
        id: true,
        title: true,
        image: true,
      },
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
      limit: 6
    }),
  ["fresh-news"],
  {
    revalidate: 60 * 60 * 2,
  },
);

export const getPaginatedNews = unstable_cache(
  async (page: number = 1, pageSize: number = 12) => {
    const offset = (page - 1) * pageSize;
    
    const [news, total] = await Promise.all([
      db.query.posts.findMany({
        columns: {
          id: true,
          title: true,
          image: true,
          createdAt: true,
          slug: true,
        },
        where: eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
        limit: pageSize,
        offset,
      }),
      
      db.select({ count: count() })
        .from(posts)
        .where(eq(posts.published, true))
    ]);

    return {
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / pageSize),
        totalItems: total[0].count,
        pageSize,
      },
    };
  },
  ["paginated-news"],
  {
    revalidate: 60 * 60 * 2,
  }
);