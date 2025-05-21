import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { desc, sql } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { playersToTitles } from '~/db/schema';
import { APITitledPlayersResponseSchema } from '~/db/queries';

const createResponse = (data: z.infer<typeof APITitledPlayersResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/titled-players')({
  GET: async ({ request }) => {
    console.info("Fetching titled players... @", request.url);

    try {
      const response = await db.query.players.findMany({
        columns: {
          id: true,
          name: true,
          imageUrl: true,
          rapid: true,
        },
        with: {
          playersToTitles: {
            columns: {},
            with: {
              title: {
                columns: {
                  title: true,
                  shortTitle: true,
                  type: true
                }
              }
            }
          }
        },
        where: (players, { exists }) =>
          exists(
            db.select()
              .from(playersToTitles)
              .where(sql`${playersToTitles.playerId} = ${players.id}`)
          ),
        orderBy: (players) => [desc(players.rapid)]
      });

      if (!response) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Titled players not found" },
        }, 404);
      }

      const validation = APITitledPlayersResponseSchema.safeParse({
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
            message: 'No titled players found'
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
