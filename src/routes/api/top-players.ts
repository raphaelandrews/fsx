import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { desc, eq } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { players } from '~/db/schema';
import { APITopPlayersResponseSchema } from '~/db/queries';

const baseConfig = {
  columns: {
    id: true,
    name: true,
    nickname: true,
    blitz: true,
    rapid: true,
    classic: true,
    imageUrl: true,
  },
  with: {
    location: { columns: { name: true, flag: true } },
    defendingChampions: {
      columns: {},
      with: { championship: { columns: { name: true } } }
    },
    playersToTitles: {
      columns: {},
      with: { title: { columns: { title: true, shortTitle: true, type: true } } }
    }
  },
  where: eq(players.active, true)
};

const createResponse = (data: z.infer<typeof APITopPlayersResponseSchema>, status = 200) =>
  json(data, { status });

export const APIRoute = createAPIFileRoute('/api/top-players')({
  GET: async ({ request }) => {
    console.info("Fetching top players", request.url);

    try {
      const [classic, rapid, blitz] = await Promise.all([
        db.query.players.findMany({
          ...baseConfig,
          orderBy: desc(players.classic),
          limit: 10
        }),
        db.query.players.findMany({
          ...baseConfig,
          orderBy: desc(players.rapid),
          limit: 10
        }),
        db.query.players.findMany({
          ...baseConfig,
          orderBy: desc(players.blitz),
          limit: 10
        })
      ]);

      if (!classic || !rapid || !blitz) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Top Players not found" },
        }, 404);
      }

      const topClassic = classic;
      const topRapid = rapid;
      const topBlitz = blitz;

      const validation = APITopPlayersResponseSchema.safeParse({
        success: true,
        data: { topClassic, topRapid, topBlitz }
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

      if (validation.data.success && (validation.data.data.topClassic.length === 0 || validation.data.data.topRapid.length === 0 || validation.data.data.topBlitz.length === 0)) {
        return createResponse({
          success: false,
          error: {
            code: 404,
            message: 'No top players players found'
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
      status: 204
    });
  }
});
