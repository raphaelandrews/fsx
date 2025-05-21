import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, desc } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { posts } from '~/db/schema';
import { APIFreshPostsResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIFreshPostsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/fresh-posts')({
  GET: async ({ request }) => {
    console.info("Fetching fresh posts... @", request.url);

    try {
      const response = await db
        .select({
          id: posts.id,
          title: posts.title,
          image: posts.image,
          slug: posts.slug,
        })
        .from(posts)
        .where(eq(posts.published, true))
        .orderBy(desc(posts.createdAt))
        .limit(6)
        .execute();

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Fresh posts not found" },
        }, 404);
      }

      const validation = APIFreshPostsResponseSchema.safeParse({
        success: true,
        data: response
      });

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return createResponse({
          success: false,
          error: {
            code: 400,
            message: 'Invalid data format',
            details: validation.error.errors,
          }
        }, 400);
      }

      if (validation.data.success && validation.data.data.length === 0) {
        return createResponse({
          success: false,
          error: {
            code: 404,
            message: 'No fresh posts found'
          }
        }, 404);
      }

      return createResponse(validation.data);

    } catch (error: unknown) {
      const details =
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined;

      if (process.env.NODE_ENV === 'development') console.error('[ERROR]:', error);
      return createResponse({
        success: false,
        error: { code: 500, message: 'Internal server error', details }
      }, 500);
    }
  },
});
