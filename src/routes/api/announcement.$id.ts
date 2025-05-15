import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { announcements } from '~/db/schema';
import { APIAnnouncementByIdResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIAnnouncementByIdResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/announcement/$id')({
  GET: async ({ request, params }) => {
    console.info(`Fetching announcement ${params.id} from ${request.url}`);
    const id = Number(params.id);

    try {
      const announcement = await db.query.announcements.findFirst({
        where: eq(announcements.id, id),
        columns: {
          id: true,
          year: true,
          number: true,
          content: true,
        },
      });

      if (!announcement) {
        return createResponse({
          success: false,
          error: { code: 404, message: `Announcement ${id} not found` },
        }, 404);
      }

      const validation = APIAnnouncementByIdResponseSchema.safeParse({ success: true, data: announcement });

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return createResponse({
          success: false,
          error: { code: 400, message: 'Invalid data format', details: validation.error.errors },
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

      console.error('[ERROR]:', error);
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

  OPTIONS: async () => new Response(null, { status: 204 }),
});
