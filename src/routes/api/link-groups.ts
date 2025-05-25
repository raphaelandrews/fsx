import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import type { z } from 'zod';

import { db } from '~/db';
import { APILinksGroupsResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APILinksGroupsResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/link-groups')({
  GET: async ({ request }) => {
    console.info("Fetching link groups... @", request.url);

    try {
      const response = await db.query.linkGroups.findMany({
        columns: {
          id: true,
          label: true,
        },
        with: {
          links: {
            columns: {
              href: true,
              label: true,
              icon: true,
              order: true
            }
          }
        },
        orderBy: (linksGroups, { asc }) => asc(linksGroups.id),
      });

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Link groups not found" },
        }, 404);
      }

      const validation = APILinksGroupsResponseSchema.safeParse({
        success: true,
        data: response
      });

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
          error: {
            code: 404,
            message: 'No link groups found'
          }
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
