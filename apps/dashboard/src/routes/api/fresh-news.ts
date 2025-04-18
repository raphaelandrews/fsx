import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, desc } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { posts } from '@fsx/engine/db/schema';
import { SuccessFreshNewsResponseSchema, ErrorFreshNewsResponseSchema } from '@fsx/engine/queries';

const corsConfig = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }
};

export const APIRoute = createAPIFileRoute('/api/fresh-news')({
  GET: async ({ request }) => {
    console.info("Fetching fresh news", request.url);

    try {
      const freshNews = await db
        .select({
          id: posts.id,
          title: posts.title,
          image: posts.image,
          slug: posts.slug,
        })
        .from(posts)
        .where(eq(posts.published, true))
        .orderBy(desc(posts.createdAt))
        .limit(6);

      const validatedFreshNews = SuccessFreshNewsResponseSchema.parse(freshNews);

      return json(validatedFreshNews, corsConfig);
    } catch (e) {
      console.error(e);

      const errorResponse = ErrorFreshNewsResponseSchema.parse({
        error: 'News not found',
      });

      return json(errorResponse, {
        ...corsConfig,
        status: 404,
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