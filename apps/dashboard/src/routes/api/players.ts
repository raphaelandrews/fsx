import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import {
  and,
  count,
  desc,
  eq,
  inArray,
  gte,
  lte,
} from 'drizzle-orm'
import type z from "zod"

import { db } from '@fsx/engine/db'
import {
  players,
  playersToTitles,
  titles,
  clubs,
  defendingChampions,
  locations,
  championships,
  clubsRelations,
} from '@fsx/engine/db/schema'
import { APIPlayersResponseSchema } from '@fsx/engine/queries'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Security-Policy': "default-src 'self'",
  'Permissions-Policy': 'interest-cohort=()',
  'X-Content-Type-Options': 'nosniff',
  'Retry-After': '120',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
}

const createResponse = (data: z.infer<typeof APIPlayersResponseSchema>, status = 200) =>
  json(data, { headers: corsHeaders, status });

function getBirthDateRange(group: string): [Date, Date] | undefined {
  const today = new Date();
  const year = today.getFullYear();

  switch (group) {
    case 'sub-8':
      return [
        new Date(year - 8, 0, 1),
        new Date(year, 11, 31),
      ];
    case 'sub-10':
      return [
        new Date(year - 10, 0, 1),
        new Date(year - 9, 11, 31),
      ];
    case 'sub-12':
      return [
        new Date(year - 12, 0, 1),
        new Date(year - 11, 11, 31),
      ];
    case 'sub-14':
      return [
        new Date(year - 14, 0, 1),
        new Date(year - 13, 11, 31),
      ];
    case 'sub-16':
      return [
        new Date(year - 16, 0, 1),
        new Date(year - 15, 11, 31),
      ];
    case 'sub-18':
      return [
        new Date(year - 18, 0, 1),
        new Date(year - 17, 11, 31),
      ];
    case 'master':
      return [
        new Date(year - 50, 0, 1),
        new Date(year - 40, 11, 31),
      ];
    case 'veterano':
      return [
        new Date(year - 64, 0, 1),
        new Date(year - 51, 11, 31),
      ];
    case 'senior':
      return [
        new Date(1900, 0, 1),
        new Date(year - 65, 11, 31),
      ];
    default:
      return undefined;
  }
}

export const APIRoute = createAPIFileRoute('/api/players')({
  GET: async ({ request }) => {
    console.info('Fetching players', request.url);
    const url = new URL(request.url);

    const validSortFields = ['rapid', 'blitz', 'classic']
    const sortBy = validSortFields.includes(url.searchParams.get('sortBy') || '')
      ? (url.searchParams.get('sortBy') as 'rapid' | 'blitz' | 'classic')
      : 'rapid'

    const qp = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 20,
      sex: url.searchParams.get('sex'),
      titles: url.searchParams.getAll('title'),
      clubs: url.searchParams.getAll('club'),
      group: url.searchParams.get('group') || undefined,
      locations: url.searchParams
        .getAll('location')
        .map(Number)
        .filter(n => !Number.isNaN(n)),
    };

    const whereConditions = [eq(players.active, true)]

    if (qp.sex === 'true' || qp.sex === 'false') {
      whereConditions.push(eq(players.sex, qp.sex === 'true'));
    }
    if (qp.titles.length) {
      whereConditions.push(inArray(titles.shortTitle, qp.titles));
    }
    if (qp.clubs.length) {
      whereConditions.push(inArray(clubs.name, qp.clubs));
    }
    if (qp.group) {
      const range = getBirthDateRange(qp.group);
      if (range) {
        whereConditions.push(
          gte(players.birth, range[0]),
          lte(players.birth, range[1]),
        );
      }
    }
    if (qp.locations.length) {
      whereConditions.push(inArray(players.locationId, qp.locations));
    }

    try {
      const rows = await db
        .select({
          id: players.id,
          name: players.name,
          nickname: players.nickname,
          classic: players.classic,
          rapid: players.rapid,
          blitz: players.blitz,
          imageUrl: players.imageUrl,
          birth: players.birth,
          sex: players.sex,
          clubs: {
            id: clubs.id,
            name: clubs.name,
            logo: clubs.logo,
          },
          locations: {
            name: locations.name,
            flag: locations.flag,
          },
          championships: {
            name: championships.name
          },
          titles: {
            type: titles.type,
            title: titles.title,
            shortTitle: titles.shortTitle,
          },
        })
        .from(players)
        .leftJoin(playersToTitles, eq(players.id, playersToTitles.playerId))
        .leftJoin(defendingChampions, eq(players.id, defendingChampions.playerId))
        .leftJoin(championships, eq(defendingChampions.championshipId, championships.id))
        .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
        .leftJoin(clubs, eq(players.clubId, clubs.id))
        .leftJoin(locations, eq(players.clubId, locations.id))
        .where(and(...whereConditions))
        .orderBy(desc(players[sortBy]))
        .limit(qp.limit)
        .offset((qp.page - 1) * qp.limit);

      const [{ value: total = 0 }] = await db
        .select({ value: count() })
        .from(players)
        .leftJoin(playersToTitles, eq(players.id, playersToTitles.playerId))
        .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
        .leftJoin(clubs, eq(players.clubId, clubs.id))
        .where(and(...whereConditions));

      const totalPages = Math.max(1, Math.ceil(total / qp.limit));
      const pagination = {
        currentPage: qp.page,
        totalPages,
        totalItems: total,
        itemsPerPage: qp.limit,
        hasNextPage: qp.page < totalPages,
        hasPreviousPage: qp.page > 1,
      };

      const formattedPlayers = rows.map(player => ({
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        classic: player.classic,
        rapid: player.rapid,
        blitz: player.blitz,
        imageUrl: player.imageUrl,
        birth: player.birth,
        sex: player.sex,
        club: {
          id: player.clubs?.id,
          name: player.clubs?.name,
          logo: player.clubs?.logo,
        },
        location: {
          name: player.locations?.name,
          flag: player.locations?.flag,
        },
        defendingChampions: player.championships ? [{
          championship: { name: player.championships.name }
        }] : [],
        playersToTitles: player.titles ? [{
          title: { type: player.titles.type, title: player.titles.title, shortTitle: player.titles.shortTitle }
        }] : [],
      }));

      const parsed = APIPlayersResponseSchema.safeParse({
        success: true,
        data: { players: formattedPlayers, pagination },
      });

      if (!parsed.success) {
        console.error('Validation failed', parsed.error);
        return createResponse({
          success: false,
          error: {
            code: 400,
            message: 'Invalid response format',
            details: parsed.error.errors,
          }
        }, 400);
      }
      if (!rows.length) {
        return createResponse({
          success: false,
          error: { code: 404, message: 'No players found' }
        }, 404);
      }
      return createResponse(parsed.data);

    } catch (error: unknown) {
      const details =
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined
      console.error(error)
      return createResponse(
        {
          success: false,
          error: {
            code: 500,
            message: 'Internal server error',
            details,
          },
        },
        500,
      )
    }
  },

  OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
});