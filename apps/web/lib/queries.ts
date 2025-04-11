import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { announcements, players, posts } from "@/db/schema";

import { unstable_cache } from "./unstable-cache";
import { TopPlayersSchema } from "@/schemas/players";

const basePlayerConfig = {
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

export const getTopPlayers = unstable_cache(
  async () => {
    const [rapid, classic, blitz] = await Promise.all([
      db.query.players.findMany({ 
        ...basePlayerConfig,
        orderBy: desc(players.rapid),
        limit: 10
      }),
      db.query.players.findMany({ 
        ...basePlayerConfig,
        orderBy: desc(players.classic),
        limit: 10
      }),
      db.query.players.findMany({ 
        ...basePlayerConfig,
        orderBy: desc(players.blitz),
        limit: 10
      })
    ]);

    return TopPlayersSchema.parse({
      topBlitz: blitz,
      topRapid: rapid,
      topClassic: classic
    });
  },
  ["top-players"],
  { revalidate: 60 * 60 * 48 }
);

export const getPlayerById = unstable_cache(
  (playerId: number) =>
    db.query.players.findFirst({
      where: (players, { eq }) => eq(players.id, playerId),
    }),
  ["player"],
  {
    revalidate: 60 * 60 * 48,
  },
);


export const getSearchPlayers = unstable_cache(
  () =>
    db.query.players.findMany({
      columns: {
        id: true,
        name: true,
      },
    }),
  ["search-players"],
  {
    revalidate: 60 * 60 * 48,
  },
);

export const getFreshNews = unstable_cache(
  () =>
    db.query.posts.findMany({
      columns: {
        id: true,
        title: true,
        image: true,
      },
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
      limit: 6
    }),
  ["fresh-news"],
  {
    revalidate: 60 * 60 * 48,
  },
);

export const getPaginatedNews = unstable_cache(
  async (page: number = 1, pageSize: number = 12) => {
    const offset = (page - 1) * pageSize;

    const [news, total] = await Promise.all([
      db.query.posts.findMany({
        columns: {
          id: true,
          title: true,
          image: true,
          createdAt: true,
          slug: true,
        },
        where: eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
        limit: pageSize,
        offset,
      }),

      db.select({ count: count() })
        .from(posts)
        .where(eq(posts.published, true))
    ]);

    return {
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / pageSize),
        totalItems: total[0].count,
        pageSize,
      },
    };
  },
  ["paginated-news"],
  {
    revalidate: 60 * 60 * 48,
  }
);

export const getFreshAnnouncements = unstable_cache(
  () =>
    db.query.announcements.findMany({
      orderBy: [desc(announcements.year), (announcements.number)],
      limit: 6
    }),
  ["fresh-announcements"],
  {
    revalidate: 60 * 60 * 48,
  },
);


export const getPaginatedAnnouncements = unstable_cache(
  async (page: number = 1, pageSize: number = 12) => {
    const offset = (page - 1) * pageSize;

    const [announcementsData, total] = await Promise.all([
      db.query.announcements.findMany({
        orderBy: [desc(announcements.year), (announcements.number)],
        limit: pageSize,
        offset,
      }),

      db.select({ count: count() })
        .from(announcements)
    ]);

    return {
      data: announcementsData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / pageSize),
        totalItems: total[0].count,
        pageSize,
      },
    };
  },
  ["paginated-announcements"],
  {
    revalidate: 60 * 60 * 48,
  }
);