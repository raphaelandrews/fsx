import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { desc } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { announcements } from '@fsx/engine/db/schema';
import { SuccessFreshAnnouncementsResponseSchema, ErrorFreshAnnouncementsResponseSchema } from '@fsx/engine/queries';

const corsConfig = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }
};

export const APIRoute = createAPIFileRoute('/api/fresh-announcements')({
  GET: async ({ request }) => {
    console.info("Fetching fresh announcements", request.url);

    try {
      const freshAnnouncements = await db
        .select({
          id: announcements.id,
          year: announcements.year,
          number: announcements.number,
          content: announcements.content,
        })
        .from(announcements)
        .orderBy(desc(announcements.year), desc(announcements.number))
        .limit(8); 

      const validatedFreshAnnouncements = SuccessFreshAnnouncementsResponseSchema.parse({
        announcements: freshAnnouncements,
      });

      return json(validatedFreshAnnouncements, corsConfig);
    } catch (e) {
      console.error(e);

      const errorResponse = ErrorFreshAnnouncementsResponseSchema.parse({
        error: 'Announcements not found'
      });
      return json(errorResponse, {
        ...corsConfig,
        status: 404
      });
    }
  },

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      ...corsConfig
    });
  },
});
