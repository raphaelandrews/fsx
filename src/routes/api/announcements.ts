import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { desc, count } from "drizzle-orm";
import type { z } from "zod";

import { db } from "~/db";
import { announcements } from "~/db/schema";
import { APIAnnouncementsResponseSchema } from "~/db/queries";

const createResponse = (data: z.infer<typeof APIAnnouncementsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute("/api/announcements")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const perPage = 12;

    console.info(`Fetching announcements by page=${page} with items=${perPage}... @`, request.url);

    try {
      const response = await db.query.announcements.findMany({
        columns: { id: true, year: true, number: true, content: true },
        orderBy: [desc(announcements.year), desc(announcements.number)],
        limit: perPage,
        offset: (page - 1) * perPage,
      });

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: `Announcements page ${page} not found` },
        }, 404);
      }

      const [{ value: total }] = await db.select({ value: count() }).from(announcements);
      const totalItems = total ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

      const pagination = {
        currentPage: page, totalPages, totalItems, itemsPerPage: perPage,
        hasNextPage: page < totalPages, hasPreviousPage: page > 1
      };

      const validation = APIAnnouncementsResponseSchema.safeParse({ success: true, data: { announcements: response, pagination } });

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
        return createResponse({ success: false, error: { code: 404, message: "No announcements found" } }, 404);
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
