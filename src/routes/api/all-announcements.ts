import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { desc } from "drizzle-orm";
import type { z } from "zod";

import { db } from "~/db";
import { announcements } from "~/db/schema";
import { APIAllAnnouncementsResponseSchema } from "~/db/queries";

const createResponse = (data: z.infer<typeof APIAllAnnouncementsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute("/api/all-announcements")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    console.info("Fetching announcements... @", url);

    try {
      const response = await db.query.announcements.findMany({
        columns: { id: true, year: true, number: true, content: true },
        orderBy: [desc(announcements.year), desc(announcements.number)],
      });

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Announcements not found" },
        }, 404);
      }

      const validation = APIAllAnnouncementsResponseSchema.safeParse({ success: true, data: response });

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
