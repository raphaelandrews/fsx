import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { desc } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { announcements } from '~/db/schema';
import { APIFreshAnnouncementsResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIFreshAnnouncementsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/fresh-announcements')({
  GET: async ({ request }) => {
    console.info(`Fetching fresh announcements from ${request.url}`);

    try {
      const response = await db
        .select({
          id: announcements.id,
          year: announcements.year,
          number: announcements.number,
          content: announcements.content,
        })
        .from(announcements)
        .orderBy(desc(announcements.year), desc(announcements.number))
        .limit(8)
        .execute();

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Fresh announcements not found" },
        }, 404);
      }

      const validation = APIFreshAnnouncementsResponseSchema.safeParse({ success: true, data: response });

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

      if (validation.data.success && validation.data.data.length === 0) {
        return createResponse({
          success: false,
          error: { code: 404, message: 'No announcements found' }
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
