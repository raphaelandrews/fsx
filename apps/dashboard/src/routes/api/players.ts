import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { count, desc, eq } from 'drizzle-orm';

import { db } from '@fsx/engine/db';
import { players } from '@fsx/engine/db/schema';
import { ErrorPlayersResponseSchema, PlayersPaginationSchema, SuccessPlayersResponseSchema } from '@fsx/engine/queries';

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

    const queryParams = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 20,
    };

    const paginationResult = PlayersPaginationSchema.safeParse({
      currentPage: queryParams.page,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 12,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    if (!paginationResult.success) {
      return json(
        { error: "Invalid pagination parameters", details: paginationResult.error.format() },
        { status: 400, headers: corsConfig.headers }
      );
    }

    const pageNumber = paginationResult.data.currentPage;
    const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20')));
    const offset = (pageNumber - 1) * limit;

    try {
      const fetchPlayers = await db.query.players.findMany({
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
        where: eq(players.active, true),
        orderBy: desc(players.rapid),
        limit: limit,
        offset: offset,
      });

      const totalCountResult = await db
        .select({ value: count() })
        .from(players)
        .where(eq(players.active, true))

      const totalCount = totalCountResult[0]?.value || 0;
      const totalPages = Math.ceil(totalCount / limit);
      paginationResult.data.totalItems = totalCount;
      paginationResult.data.totalPages = totalPages;
      paginationResult.data.hasNextPage = pageNumber < totalPages;
      paginationResult.data.hasPreviousPage = pageNumber > 1;

      const validatedPlayers = fetchPlayers.map((player) =>
        SuccessPlayersResponseSchema.safeParse(player)
      );

      const invalidPlayers = validatedPlayers.filter(result => !result.success);

      if (invalidPlayers.length > 0) {
        return json({ error: "Invalid announcement data", details: invalidPlayers.map(result => result.error.format()) }, {
          status: 500,
          headers: corsConfig.headers,
        });
      }

      if (!fetchPlayers.length) {
        const errorResponse = {
          error: "No players found",
          pagination: paginationResult.data,
        };
        return json(errorResponse, { status: 404, headers: corsConfig.headers });
      }

      const response = {
        players: fetchPlayers,
        pagination: paginationResult.data,
      };

      return json(response, { headers: corsConfig.headers });

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
