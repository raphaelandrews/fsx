import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { count, desc, eq } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { posts } from '@fsx/engine/db/schema';
import { NewsPaginationSchema, SuccessNewsResponseSchema } from '@fsx/engine/queries';

const corsConfig = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }
};

export const APIRoute = createAPIFileRoute('/api/news')({
  GET: async ({ request }) => {
    console.info("Fetching news", request.url);

    const url = new URL(request.url);

    const queryParams = {
      page: Number(url.searchParams.get('page')) || 1,
    };

    const paginationResult = NewsPaginationSchema.safeParse({
      currentPage: queryParams.page,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 12,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    if (!paginationResult.success) {
      return json(
        { error: "Invalid pagination parameters", details: paginationResult.error.format() },
        { status: 400, headers: corsConfig.headers }
      );
    }

    const pageNumber = paginationResult.data.currentPage;
    const newsPerPage = paginationResult.data.itemsPerPage;
    const offset = (pageNumber - 1) * newsPerPage;

    try {
      const fetchedNews = await db.query.posts.findMany({
        columns: {
          id: true,
          title: true,
          image: true,
          slug: true,
          createdAt: true
        },
        where: eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
        limit: newsPerPage,
        offset: offset
      });

      const totalCountResult = await db
        .select({ value: count() })
        .from(posts)
        .where(eq(posts.published, true));

      const totalCount = totalCountResult[0]?.value || 0;
      const totalPages = Math.ceil(totalCount / newsPerPage);
      paginationResult.data.totalItems = totalCount;
      paginationResult.data.totalPages = totalPages;
      paginationResult.data.hasNextPage = pageNumber < totalPages;
      paginationResult.data.hasPreviousPage = pageNumber > 1;

      const formattedNews = fetchedNews.map(news => ({
        ...news,
        createdAt: news.createdAt?.toISOString() ?? new Date().toISOString(),
      }));

      const validatedNews = formattedNews.map((news) =>
        SuccessNewsResponseSchema.safeParse(news)
      );

      const invalidNews = validatedNews.filter(result => !result.success);

      if (invalidNews.length > 0) {
        return json({ error: "Invalid news data", details: invalidNews.map(result => result.error.format()) }, {
          status: 500,
          headers: corsConfig.headers,
        });
      }

      if (!fetchedNews.length) {
        const errorResponse = {
          error: "No news found",
          pagination: paginationResult.data,
        };
        return json(errorResponse, { status: 404, headers: corsConfig.headers });
      }

      const response = {
        news: fetchedNews,
        pagination: paginationResult.data,
      };

      return json(response, { headers: corsConfig.headers });

    } catch (e) {
      console.error(e);
      return json({
        error: 'Internal server error'
      }, {
        status: 500,
        headers: corsConfig.headers
      });
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      ...corsConfig
    });
  },
});
