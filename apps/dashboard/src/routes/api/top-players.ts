import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { desc, eq } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { players } from '@fsx/engine/db/schema';
import { ErrorTopPlayersResponseSchema, SuccessTopPlayersResponseSchema } from '@fsx/engine/queries';

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

const corsConfig = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }
};

export const APIRoute = createAPIFileRoute('/api/top-players')({
  GET: async ({ request }) => {
    console.info("Fetching top players", request.url);
    
    try {
      const [rapid, classic, blitz] = await Promise.all([
        db.query.players.findMany({
          ...baseConfig,
          orderBy: desc(players.rapid),
          limit: 10
        }),
        db.query.players.findMany({
          ...baseConfig,
          orderBy: desc(players.classic),
          limit: 10
        }),
        db.query.players.findMany({
          ...baseConfig,
          orderBy: desc(players.blitz),
          limit: 10
        })
      ]);

      const topBlitz = blitz;
      const topRapid = rapid;
      const topClassic = classic;

      const validatedTopPlayers = SuccessTopPlayersResponseSchema.parse({ topBlitz, topRapid, topClassic });

      return json(validatedTopPlayers, { headers: corsConfig.headers });
    } catch (e) {
      console.error(e);
      const errorResponse = ErrorTopPlayersResponseSchema.parse({
        error: 'Players not found'
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
