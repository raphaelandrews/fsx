import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { desc, sql } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '~/db';
import { players } from '~/db/schema';
import { APISearchPlayersResponseSchema } from '~/db/queries';

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
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q') || '';

      console.info("Searching players with query:", query);

      function normalizeText(text: string): string {
        return text
          .normalize('NFD')
          // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
      }

      const searchQuery = await db
        .select({
          id: players.id,
          name: players.name
        })
        .from(players)
        .where(
          query.trim() ?
            sql`LOWER(${players.name}) ILIKE ${`%${query}%`} OR LOWER(translate(${players.name}, 'áàâãäéèêëíìîïóòôõöúùûüýÿ', 'aaaaaeeeeiiiiooooouuuuyy')) ILIKE ${`%${normalizeText(query)}%`}` :
            sql`1=1`
        )
        .orderBy(desc(players.rapid))
        .limit(10)
        .execute();

      if (!searchQuery) {
        return createResponse({
          success: false,
          error: { code: 404, message: "Players not found" },
        }, 404);
      }

      const validation = APISearchPlayersResponseSchema.safeParse({
        success: true,
        data: searchQuery
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
          success: true,
          data: []
        });
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