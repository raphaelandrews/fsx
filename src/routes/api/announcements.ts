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
    console.info(`Fetching announcements from ${request.url}`);

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const perPage = 12;

    try {
      const items = await db.query.announcements.findMany({
        columns: { id: true, year: true, number: true, content: true },
        orderBy: [desc(announcements.year), desc(announcements.number)],
        limit: perPage,
        offset: (page - 1) * perPage,
      });

      if (!items) {
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

      const parsed = APIAnnouncementsResponseSchema.safeParse({ success: true, data: { announcements: items, pagination } });

      if (!parsed.success) {
        console.error("Validation failed:", parsed.error);
        return createResponse({ success: false, error: { code: 400, message: "Invalid data format", details: parsed.error.errors } }, 400);
      }

      if (items.length === 0) {
        return createResponse({ success: false, error: { code: 404, message: "No announcements found" } }, 404);
      }

      return createResponse(parsed.data);

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