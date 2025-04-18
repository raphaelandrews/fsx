import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { posts } from '@fsx/engine/db/schema';
import { SuccessNewsBySlugResponseSchema, ErrorNewsBySlugResponseSchema } from '@fsx/engine/queries';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

export const APIRoute = createAPIFileRoute('/api/news/$slug')({
  GET: async ({ request, params }) => {
    console.info(`Fetching news by slug=${params.slug}... @`, request.url);

    try {
      const newsBySlug = await db.query.posts.findFirst({
        where: and(
          eq(posts.slug, params.slug),
          eq(posts.published, true)
        ),
        columns: {
          id: true,
          title: true,
          image: true,
          content: true,
          slug: true,
          createdAt: true,
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });

      if (!newsBySlug) {
        throw new Error('Post not found');
      }

      const formattedPost = {
        ...newsBySlug,
        createdAt: newsBySlug.createdAt?.toISOString() ?? new Date().toISOString(),
      };

      const validatedNewsBySlug = SuccessNewsBySlugResponseSchema.parse(formattedPost);

      return json(validatedNewsBySlug, { 
        headers: corsHeaders 
      });
    } catch (e) {
      console.error(e);
      const errorResponse = ErrorNewsBySlugResponseSchema.parse({
        error: `News with slug "${params.slug}" not found`
      });
      return json(errorResponse, { 
        status: 404, 
        headers: corsHeaders 
      });
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  },
});