import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, desc } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { posts } from '~/db/schema';
import { APIFreshNewsResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIFreshNewsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/fresh-news')({
  GET: async ({ request }) => {
    console.info(`Fetching fresh news from ${request.url}`);

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
        .limit(6)
        .execute();

      if (!freshNews) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Fresh news not found" },
        }, 404);
      }

      const validation = APIFreshNewsResponseSchema.safeParse({
        success: true,
        data: freshNews
      });

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return createResponse({
          success: false,
          error: {
            code: 400,
            message: 'Invalid data format',
            details: validation.error.errors
          }
        }, 400);
      }

      if (validation.data.success && validation.data.data.length === 0) {
        return createResponse({
          success: false,
          error: {
            code: 404,
            message: 'No fresh news found'
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

      console.error("[ERROR]:", error);
      return createResponse({
        success: false,
        error: {
          code: 500,
          message: 'Internal server error',
          details,
        }
      }, 500);
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204
    });
  }
});
