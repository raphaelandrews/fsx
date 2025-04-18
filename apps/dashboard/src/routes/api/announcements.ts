import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import {  desc, count } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { announcements } from '@fsx/engine/db/schema';
import { AnnouncementByIdResponseSchema, AnnouncementsPaginationSchema } from '@fsx/engine/queries';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const APIRoute = createAPIFileRoute('/api/announcements')({
  GET: async ({ request }) => {
    console.info("Fetching announcements", request.url);

    const url = new URL(request.url);

    const queryParams = {
      page: Number(url.searchParams.get('page')) || 1, 
    };

    const paginationResult = AnnouncementsPaginationSchema.safeParse({
      currentPage: queryParams.page,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 12,  
      hasNextPage: false, 
      hasPreviousPage: false,
    });

    if (!paginationResult.success) {
      return json(
        { error: "Invalid pagination parameters", details: paginationResult.error.format() },
        { status: 400, headers: corsHeaders }
      );
    }

    const pageNumber = paginationResult.data.currentPage;
    const announcementsPerPage = paginationResult.data.itemsPerPage;
    const offset = (pageNumber - 1) * announcementsPerPage;

    try {
      const fetchedAnnouncements = await db.query.announcements.findMany({
        columns: {
          id: true,
          year: true,
          number: true,
          content: true,
        },
        orderBy: [desc(announcements.year), desc(announcements.number)],
        limit: announcementsPerPage,
        offset: offset,
      });

      const totalCountResult = await db
        .select({ value: count() })
        .from(announcements);

      const totalCount = totalCountResult[0]?.value || 0;
      const totalPages = Math.ceil(totalCount / announcementsPerPage);
      paginationResult.data.totalItems = totalCount;
      paginationResult.data.totalPages = totalPages;
      paginationResult.data.hasNextPage = pageNumber < totalPages;
      paginationResult.data.hasPreviousPage = pageNumber > 1;

      const validatedAnnouncements = fetchedAnnouncements.map((announcement) =>
        AnnouncementByIdResponseSchema.safeParse(announcement)
      );

      const invalidAnnouncements = validatedAnnouncements.filter(result => !result.success);

      if (invalidAnnouncements.length > 0) {
        return json({ error: "Invalid announcement data", details: invalidAnnouncements.map(result => result.error.format()) }, {
          status: 500,
          headers: corsHeaders,
        });
      }

      if (!fetchedAnnouncements.length) {
        const errorResponse = {
          error: "No announcements found",
          pagination: paginationResult.data,
        };
        return json(errorResponse, { status: 404, headers: corsHeaders });
      }

      const response = {
        announcements: fetchedAnnouncements,
        pagination: paginationResult.data,
      };

      return json(response, { headers: corsHeaders });

    } catch (e) {
      console.error(e);
      return json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      );
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  },
});
