import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { desc } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { players } from '@fsx/engine/db/schema';
import { ErrorSearchPlayersResponseSchema, SuccessSearchPlayersResponseSchema } from '@fsx/engine/queries';

const corsConfig = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }
};

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

      const validatedSearchPlayers = SuccessSearchPlayersResponseSchema.parse(searchPlayers);

      return json(validatedSearchPlayers, { 
        headers: corsConfig.headers 
      });
    } catch (e) {
      console.error(e);
      const errorResponse = ErrorSearchPlayersResponseSchema.parse({
        error: 'Players not found'
      });
      return json(errorResponse, { 
        status: 404, 
        headers: corsConfig.headers
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
