import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { desc } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '@fsx/engine/db';
import { players } from '@fsx/engine/db/schema';
import { APISearchPlayersResponseSchema } from '@fsx/engine/queries';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Security-Policy': "default-src 'self'",
  'Permissions-Policy': 'interest-cohort=()',
  'X-Content-Type-Options': 'nosniff',
  'Retry-After': '120',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
};

const createResponse = (data: z.infer<typeof APISearchPlayersResponseSchema>, status = 200) =>
  json(data, { headers: corsHeaders, status });

export const APIRoute = createAPIFileRoute('/api/search-players')({
  GET: async ({ request }) => {
    console.info("Fetching players", request.url);

    try {
      const searchPlayers = await db
        .select({
          id: players.id,
          name: players.name
        })
        .from(players)
        .orderBy(desc(players.rapid))
        .execute();

      if (!searchPlayers) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Players not found" },
        }, 404);
      }

      const validation = APISearchPlayersResponseSchema.safeParse({
        success: true,
        data: searchPlayers
      });

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return createResponse({
          success: false,
          error: {
            code: 400,
            message: 'Invalid data format',
            details: validation.error.errors
          }
        }, 400);
      }

      if (validation.data.success && validation.data.data.length === 0) {
        return createResponse({
          success: false,
          error: {
            code: 404,
            message: 'No players players found'
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

      console.error("[ERROR]:", error);
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

  OPTIONS: async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
});
