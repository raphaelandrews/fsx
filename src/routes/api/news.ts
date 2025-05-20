import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { eq, desc, count } from "drizzle-orm";
import type { z } from "zod";

import { db } from "~/db";
import { posts } from "~/db/schema";
import { APINewsByPageResponseSchema } from "~/db/queries";

const createResponse = (data: z.infer<typeof APINewsByPageResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute("/api/news")({
  GET: async ({ request }) => {
    console.info(`Fetching news from ${request.url}`);

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const perPage = 12;

    try {
      const news = await db.query.posts.findMany({
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

      if (!news) {
        return createResponse({
          success: false,
          error: { code: 404, message: `News page ${page} not found` },
        }, 404);
      }

      const [{ value: total }] = await db.select({ value: count() }).from(posts);
      const totalItems = total ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

      const pagination = {
        currentPage: page, totalPages, totalItems, itemsPerPage: perPage,
        hasNextPage: page < totalPages, hasPreviousPage: page > 1
      };

      const formattedNews = news.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toISOString() ?? null,
      }));

      const validation = APINewsByPageResponseSchema.safeParse({ success: true, data: { news: formattedNews, pagination } });

      if (!validation.success) {
        console.error("Validation failed:", validation.error);
        return createResponse({ success: false, error: { code: 400, message: "Invalid data format", details: validation.error.errors } }, 400);
      }

      if (news.length === 0) {
        return createResponse({ success: false, error: { code: 404, message: "No news found" } }, 404);
      }

      return createResponse(validation.data);

    } catch (error: unknown) {
      const details = process.env.NODE_ENV === "development"
        ? error instanceof Error ? error.message : String(error)
        : undefined;
      console.error(error);
      return createResponse({ success: false, error: { code: 500, message: "Internal server error", details } }, 500);
    }
  },

  OPTIONS: async () => new Response(null, { status: 204 }),
});
