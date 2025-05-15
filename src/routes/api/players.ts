import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import {
  and,
  desc,
  eq,
  inArray,
  gte,
  lte,
  or,
  count,
  sql,
} from 'drizzle-orm'
import type z from "zod"

import { db } from '~/db'
import {
  players,
  playersToTitles,
  titles,
  clubs,
  defendingChampions,
  locations,
  championships,
} from '~/db/schema'
import { APIPlayersResponseSchema } from '~/db/queries'

const createResponse = (data: z.infer<typeof APIPlayersResponseSchema>, status = 200) =>
  json(data, { status });

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

    const queryparams = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 20,
      sex: url.searchParams.get('sex'),
      titles: url.searchParams.getAll('title'),
      clubs: url.searchParams.getAll('club'),
      groups: url.searchParams.getAll('group'),
      locations: url.searchParams.getAll('location'),
    };

    const whereConditions = [eq(players.active, true)]

    if (queryparams.sex === 'true' || queryparams.sex === 'false') {
      whereConditions.push(eq(players.sex, queryparams.sex === 'true'));
    }
    if (queryparams.titles.length) {
      whereConditions.push(inArray(titles.shortTitle, queryparams.titles));
    }
    if (queryparams.clubs.length) {
      whereConditions.push(inArray(clubs.name, queryparams.clubs));
    }
    if (queryparams.groups.length) {
      const groupConditions = [];
      for (const group of queryparams.groups) {
        const range = getBirthDateRange(group);
        if (range) {
          groupConditions.push(
            and(
              gte(players.birth, range[0]),
              lte(players.birth, range[1])
            )
          );
        }
      }
      if (groupConditions.length > 0) {
        const condition = groupConditions.length === 1
          ? groupConditions[0]
          : or(...groupConditions);

        if (condition) {
          whereConditions.push(condition);
        }
      }
    }
    if (queryparams.locations.length) {
      whereConditions.push(inArray(locations.name, queryparams.locations));
    }

    try {
      const countResult = await db
        .select({ count: count() })
        .from(players)
        .leftJoin(playersToTitles, eq(players.id, playersToTitles.playerId))
        .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
        .leftJoin(clubs, eq(players.clubId, clubs.id))
        .leftJoin(locations, eq(players.locationId, locations.id))
        .where(and(...whereConditions))
        .groupBy(players.id);

      const uniquePlayerCount = countResult.length;
      const totalPages = Math.max(1, Math.ceil(uniquePlayerCount / queryparams.limit));

      const offset = (queryparams.page - 1) * queryparams.limit;

      const subquery = db
        .select({
          id: players.id,
          sortValue: players[sortBy]
        })
        .from(players)
        .leftJoin(playersToTitles, eq(players.id, playersToTitles.playerId))
        .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
        .leftJoin(clubs, eq(players.clubId, clubs.id))
        .leftJoin(locations, eq(players.locationId, locations.id))
        .where(and(...whereConditions))
        .groupBy(players.id)
        .orderBy(desc(players[sortBy]))
        .limit(queryparams.limit)
        .offset(offset)
        .as('subq');

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
        .leftJoin(locations, eq(players.locationId, locations.id))
        .innerJoin(subquery, eq(players.id, subquery.id))
        .orderBy(desc(players[sortBy]));

      const playersMap = new Map();

      for (const row of rows) {
        if (!playersMap.has(row.id)) {
          playersMap.set(row.id, {
            id: row.id,
            name: row.name,
            nickname: row.nickname,
            classic: row.classic,
            rapid: row.rapid,
            blitz: row.blitz,
            imageUrl: row.imageUrl,
            birth: row.birth,
            sex: row.sex,
            club: {
              id: row.clubs?.id ?? 0,
              name: row.clubs?.name ?? "",
              logo: row.clubs?.logo ?? "",
            },
            location: {
              name: row.locations?.name ?? "",
              flag: row.locations?.flag ?? "",
            },
            defendingChampions: [],
            playersToTitles: [],
          });
        }

        const player = playersMap.get(row.id);

        if (row.championships?.name) {
          const championshipExists = player.defendingChampions.some(
            (c: { championship: { name: string | undefined } }) => c.championship.name === row.championships?.name
          );

          if (!championshipExists) {
            player.defendingChampions.push({
              championship: { name: row.championships.name }
            });
          }
        }

        if (row.titles?.shortTitle) {
          const titleExists = player.playersToTitles.some(
            (t: { title: { shortTitle: string | undefined; type: string | undefined } }) =>
              t.title.shortTitle === row.titles?.shortTitle && t.title.type === row.titles?.type
          );

          if (!titleExists) {
            player.playersToTitles.push({
              title: {
                type: row.titles.type,
                title: row.titles.title,
                shortTitle: row.titles.shortTitle
              }
            });
          }
        }
      }

      const uniquePlayers = Array.from(playersMap.values());

      const pagination = {
        currentPage: queryparams.page,
        totalPages,
        totalItems: uniquePlayerCount,
        itemsPerPage: queryparams.limit,
        hasNextPage: queryparams.page < totalPages,
        hasPreviousPage: queryparams.page > 1,
      };

      const parsed = APIPlayersResponseSchema.safeParse({
        success: true,
        data: { players: uniquePlayers, pagination },
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

      if (!uniquePlayers.length) {
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

  OPTIONS: async () => new Response(null, { status: 204 }),
});
