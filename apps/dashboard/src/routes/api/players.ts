import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { count, desc, eq } from 'drizzle-orm';
import type { z } from "zod";

import { db } from '@fsx/engine/db';
import { players } from '@fsx/engine/db/schema';
import { APIPlayersResponseSchema } from "@fsx/engine/queries";

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

const createResponse = (data: z.infer<typeof APIPlayersResponseSchema>, status = 200) =>
  json(data, { headers: corsHeaders, status });

export const APIRoute = createAPIFileRoute('/api/players')({
  GET: async ({ request }) => {
    console.info("Fetching players", request.url);

    const url = new URL(request.url);

    const queryParams = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 20,
    };

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
        limit: queryParams.limit,
        offset: (queryParams.page - 1) * queryParams.limit,
      });

      if (!fetchPlayers) {
        return createResponse({
          success: false,
          error: { code: 404, message: `Players page ${queryParams.page} not found` },
        }, 404);
      }

      const [{ value: total }] = await db.select({ value: count() }).from(players);
      const totalItems = total ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / queryParams.limit));

      const pagination = {
        currentPage: queryParams.page, totalPages, totalItems, itemsPerPage: queryParams.limit,
        hasNextPage: queryParams.page < totalPages, hasPreviousPage: queryParams.page > 1
      };

      const parsed = APIPlayersResponseSchema.safeParse({ success: true, data: { players: fetchPlayers, pagination } });

      if (!parsed.success) {
        console.error("Validation failed:", parsed.error);
        return createResponse({ success: false, error: { code: 400, message: "Invalid data format", details: parsed.error.errors } }, 400);
      }

      if (fetchPlayers.length === 0) {
        return createResponse({ success: false, error: { code: 404, message: "No players found" } }, 404);
      }

      return createResponse(parsed.data);

    } catch (error: unknown) {
      const details = process.env.NODE_ENV === "development"
        ? error instanceof Error ? error.message : String(error)
        : undefined;
      console.error(error);
      return createResponse({ success: false, error: { code: 500, message: "Internal server error", details } }, 500);
    }
  },

  OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
});