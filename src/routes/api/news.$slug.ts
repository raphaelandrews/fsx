import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { posts } from '~/db/schema';
import { APINewsBySlugResponseSchema } from '~/db/queries';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Security-Policy': "default-src 'self'",
  'Permissions-Policy': 'interest-cohort=()',
  'X-Content-Type-Options': 'nosniff',
  'Retry-After': '120',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
};

const createResponse = (data: z.infer<typeof APINewsBySlugResponseSchema>, status = 200) =>
  json(data, { headers: corsHeaders, status });

export const APIRoute = createAPIFileRoute('/api/news/$slug')({
  GET: async ({ request, params }) => {
    console.info(`Fetching news ${params.slug} from ${request.url}`);
    const slug = params.slug;

    try {
      const news = await db.query.posts.findFirst({
        where: and(eq(posts.slug, slug), eq(posts.published, true)),
        columns: {
          id: true,
          title: true,
          image: true,
          content: true,
          slug: true,
          createdAt: true,
        },
      });

      if (!news) {
        return createResponse({
          success: false,
          error: { code: 404, message: `News with slug \"${slug}\" not found` },
        }, 404);
      }

      const formattedNews = { ...news, createdAt: news?.createdAt?.toISOString() };

      const validation = APINewsBySlugResponseSchema.safeParse({ success: true, data: formattedNews });

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return createResponse({
          success: false,
          error: { code: 400, message: 'Invalid data format', details: validation.error.errors },
        }, 400);
      }

      return createResponse(validation.data);

    } catch (error: unknown) {
      const details =
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined;

      console.error('[ERROR]:', error);
      return createResponse({
        success: false,
        error: { code: 500, message: 'Internal server error', details },
      }, 500);
    }
  },

  OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
});
