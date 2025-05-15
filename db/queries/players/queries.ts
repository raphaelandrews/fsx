import { and, count, desc, eq, gte, inArray, lte, or } from 'drizzle-orm';

import { db } from "@/db";
import { championships, clubs, defendingChampions, locations, players, playersToTitles, titles } from "@/db/schema";
import { unstable_cache } from "@/lib/unstable_cache";

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

export const getPlayersByPage = unstable_cache(
  async (params: {
    page?: number
    limit?: number
    sex?: boolean
    titles?: string[]
    clubs?: string[]
    groups?: string[]
    locations?: string[]
    sortBy?: 'rapid' | 'blitz' | 'classic'
  }) => {
    const {
      page = 1,
      limit = 20,
      sex,
      titles: titleFilters = [],
      clubs: clubFilters = [],
      groups: groupFilters = [],
      locations: locationFilters = [],
      sortBy = 'rapid'
    } = params

    const whereConditions = [eq(players.active, true)]

    if (sex === true || sex === false) {
      whereConditions.push(eq(players.sex, sex === true))
    }
    if (titleFilters.length) {
      whereConditions.push(inArray(titles.shortTitle, titleFilters))
    }
    if (clubFilters.length) {
      whereConditions.push(inArray(clubs.name, clubFilters))
    }
    if (groupFilters.length) {
      const groupConditions = [];
      for (const group of groupFilters) {
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
    if (locationFilters.length) {
      whereConditions.push(inArray(locations.name, locationFilters))
    }

    const countResult = await db
      .select({ count: count() })
      .from(players)
      .leftJoin(playersToTitles, eq(players.id, playersToTitles.playerId))
      .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
      .leftJoin(clubs, eq(players.clubId, clubs.id))
      .leftJoin(locations, eq(players.locationId, locations.id))
      .where(and(...whereConditions))
      .groupBy(players.id)

    const uniquePlayerCount = countResult.length
    const totalPages = Math.max(1, Math.ceil(uniquePlayerCount / limit))
    const offset = (page - 1) * limit

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
      .limit(limit)
      .offset(offset)
      .as('subq')

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
      .orderBy(desc(players[sortBy]))

    const playersMap = new Map()

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
        })
      }

      const player = playersMap.get(row.id)

      if (row.championships?.name) {
        const championshipExists = player.defendingChampions.some(
          (c: { championship: { name: string } }) => c.championship.name === row.championships?.name
        )
        if (!championshipExists) {
          player.defendingChampions.push({
            championship: { name: row.championships.name }
          })
        }
      }

      if (row.titles?.shortTitle) {
        const titleExists = player.playersToTitles.some(
          (t: { title: { shortTitle: string; type: string } }) =>
            t.title.shortTitle === row.titles?.shortTitle && t.title.type === row.titles?.type
        )
        if (!titleExists) {
          player.playersToTitles.push({
            title: {
              type: row.titles.type,
              title: row.titles.title,
              shortTitle: row.titles.shortTitle
            }
          })
        }
      }
    }

    return {
      players: Array.from(playersMap.values()),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: uniquePlayerCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    }
  },
  ['players-by-page'],
  {
    revalidate: 60 * 60 * 24 * 30,
    tags: ['players']
  }
)