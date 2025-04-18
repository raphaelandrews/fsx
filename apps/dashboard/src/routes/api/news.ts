import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@fsx/engine/db';
import { posts } from '@fsx/engine/db/schema';
import { PaginatedNewsResponseSchema, ErrorNewsResponseSchema } from '@fsx/engine/queries';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const APIRoute = createAPIFileRoute('/api/news')({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const pageNumber = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const newsPerPage = 12;
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

      const formattedNews = fetchedNews.map(news => ({
        ...news,
        createdAt: news.createdAt?.toISOString() ?? new Date().toISOString(),
      }));

      if (formattedNews.length === 0) {
        const errorResponse = ErrorNewsResponseSchema.parse({
          error: "No posts found",
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalItems: totalCount
          }
        });
        return json(errorResponse, { 
          status: 404, 
          headers: corsHeaders 
        });
      }

      const response = {
        news: formattedNews,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: newsPerPage,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1
        }
      };

      const validatedResponse = PaginatedNewsResponseSchema.parse(response);

      return json(validatedResponse, { 
        headers: corsHeaders 
      });
    } catch (e) {
      console.error(e);
      return json({ 
        error: 'Internal server error' 
      }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  },
});