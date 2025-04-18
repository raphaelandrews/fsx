import { createAPIFileRoute } from '@tanstack/react-start/api';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { announcements } from '@fsx/engine/db/schema';
import { SuccessAnnouncementByIdResponseSchema, ErrorAnnouncementByIdResponseSchema } from '@fsx/engine/queries';

const corsConfig = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }
};

export const APIRoute = createAPIFileRoute('/api/announcement/$id')({
  GET: async ({ request, params }) => {
    console.info(`Fetching announcements by id=${params.id}... @`, request.url);

    try {
      const announcementsById = await db.query.announcements.findFirst({
        where: eq(announcements.id, Number(params.id)),
        columns: {
          id: true,
          year: true,
          number: true,
          content: true,
        },
      });

      if (!announcementsById) {
        throw new Error('Not found');
      }

      const validatedAnnouncementsById = SuccessAnnouncementByIdResponseSchema.parse(announcementsById);

      return json(validatedAnnouncementsById, { headers: corsConfig.headers });
    } catch (e) {
      console.error(e);
      const errorResponse = ErrorAnnouncementByIdResponseSchema.parse({
        error: `Announcement ${params.id} not found`,
      });
      return json(errorResponse, { status: 404, headers: corsConfig.headers });
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      ...corsConfig
    });
  },
});
