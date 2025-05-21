import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import type { z } from 'zod';

import { db } from '~/db';
import { APIPlayersRolesResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APIPlayersRolesResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/players-roles')({
  GET: async ({ request }) => {
    console.info("Fetching players with roles... @", request.url);

    try {
      const response = await db.query.roles.findMany({
        columns: {
          role: true,
          type: true,
        },
        with: {
          playersToRoles: {
            columns: {},
            with: {
              player: {
                columns: {
                  id: true,
                  name: true,
                  imageUrl: true
                }
              }
            }
          }
        },
      });

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Players with roles not found" },
        }, 404);
      }

      const validation = APIPlayersRolesResponseSchema.safeParse({
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
            message: 'No players with roles found'
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
