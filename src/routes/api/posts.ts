import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { eq, desc, count } from "drizzle-orm";
import type { z } from "zod";

import { db } from "~/db";
import { posts } from "~/db/schema";
import { APIPostsByPageResponseSchema } from "~/db/queries";

const createResponse = (data: z.infer<typeof APIPostsByPageResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute("/api/posts")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const perPage = 12;

    console.info(`Fetching posts by page=${page} with items=${perPage}... @`, request.url);

    try {
      const response = await db.query.posts.findMany({
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

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: `Posts page ${page} not found` },
        }, 404);
      }

      const [{ value: total }] = await db.select({ value: count() }).from(posts);
      const totalItems = total ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

      const pagination = {
        currentPage: page, totalPages, totalItems, itemsPerPage: perPage,
        hasNextPage: page < totalPages, hasPreviousPage: page > 1
      };

      const formattedPosts = response.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toISOString() ?? null,
      }));

      const validation = APIPostsByPageResponseSchema.safeParse({ success: true, data: { posts: formattedPosts, pagination } });

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

      if (response.length === 0) {
        return createResponse({
          success: false,
          error: { code: 404, message: 'No posts found' }
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
