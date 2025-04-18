import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { count, desc, eq } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { players } from '@fsx/engine/db/schema';
import { ErrorPlayersResponseSchema, SuccessPlayersResponseSchema } from '@fsx/engine/queries';

const corsConfig = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }
};

export const APIRoute = createAPIFileRoute('/api/players')({
  GET: async ({ request }) => {
    console.info("Fetching players", request.url);
    
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    try {
      const players = await db.query.players.findMany({
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
        where: eq(playersSchema.active, true),
        orderBy: desc(playersSchema.rapid),
        limit: limit,
        offset: offset,
      });

      const totalCount = await db
        .select({ count: count() })
        .from(playersSchema)
        .where(eq(playersSchema.active, true))
        .then(res => res[0]?.count || 0);

      const validatedPlayers = SuccessPlayersResponseSchema.parse(players);

      return json({
        data: validatedPlayers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
        }
      }, corsConfig);
    } catch (e) {
      console.error(e);
      const errorResponse = ErrorPlayersResponseSchema.parse({
        error: 'Players not found'
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
