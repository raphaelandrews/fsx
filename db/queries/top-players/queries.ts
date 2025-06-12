import { desc, eq } from 'drizzle-orm';

import { db } from "@/db";
import { players } from "@/db/schema";
import { unstable_cache } from "@/lib/unstable_cache";

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

export const getTopPlayers = unstable_cache(
  async () => {
    const topClassic = await db.query.players.findMany({
      ...baseConfig,
      orderBy: desc(players.classic),
      limit: 10
    });

    const topRapid = await db.query.players.findMany({
      ...baseConfig,
      orderBy: desc(players.rapid),
      limit: 10
    });

    const topBlitz = await db.query.players.findMany({
      ...baseConfig,
      orderBy: desc(players.blitz),
      limit: 10
    });

    return { topClassic, topRapid, topBlitz };
  },
  ['top-players'],
  {
    revalidate: 60 * 60 * 24 * 15,
    tags: ["top-players"],
  }
);
