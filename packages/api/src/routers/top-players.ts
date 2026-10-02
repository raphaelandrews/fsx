import { eq } from "drizzle-orm";

import { players } from "@fsx/db/schema/players";
import { publicProcedure, router } from "../index";

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
    defendingChampions: {
      columns: {},
      with: { championship: { columns: { name: true } } },
    },
    playersToTitles: {
      columns: {},
      with: { title: { columns: { name: true, shortName: true, type: true } } },
    },
  },
} as const;

export const topPlayersRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const topClassic = await ctx.db.query.players.findMany({
      orderBy: (players, { desc: d, asc }) => [d(players.classic), asc(players.id)],
      limit: 10,
      where: eq(players.active, true),
      columns: baseConfig.columns,
      with: baseConfig.with,
    });
    const topRapid = await ctx.db.query.players.findMany({
      orderBy: (players, { desc: d, asc }) => [d(players.rapid), asc(players.id)],
      limit: 10,
      where: eq(players.active, true),
      columns: baseConfig.columns,
      with: baseConfig.with,
    });
    const topBlitz = await ctx.db.query.players.findMany({
      orderBy: (players, { desc: d, asc }) => [d(players.blitz), asc(players.id)],
      limit: 10,
      where: eq(players.active, true),
      columns: baseConfig.columns,
      with: baseConfig.with,
    });
    return { topClassic, topRapid, topBlitz };
  }),
});
