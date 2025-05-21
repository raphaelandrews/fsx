import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { posts } from '~/db/schema';
import { APIPostsBySlugResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIPostsBySlugResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/posts/$slug')({
  GET: async ({ request, params }) => {
    const slug = params.slug;
    console.info(`Fetching post ${slug} from ${request.url}`);

    try {
      const response = await db.query.posts.findFirst({
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

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: `Posts with slug \"${slug}\" not found` },
        }, 404);
      }

      const formattedPosts = { ...response, createdAt: response?.createdAt?.toISOString() };

      const validation = APIPostsBySlugResponseSchema.safeParse({ success: true, data: formattedPosts });

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
