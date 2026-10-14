import { eq } from "drizzle-orm";

import { players } from "@fsx/db/schema/players";
import type { Context } from "../context";
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
      columns: { championshipId: true },
      with: { championship: { columns: { name: true } } },
    },
    playersToTitles: {
      columns: {},
      with: { title: { columns: { name: true, shortName: true, type: true } } },
    },
  },
} as const;

const topBy = (db: Context["db"], format: "classic" | "rapid" | "blitz") =>
  db.query.players.findMany({
    orderBy: (players, { desc, asc }) => [desc(players[format]), asc(players.id)],
    limit: 10,
    where: eq(players.active, true),
    columns: baseConfig.columns,
    with: baseConfig.with,
  });

export const topPlayersRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const [topClassic, topRapid, topBlitz] = await Promise.all([
      topBy(ctx.db, "classic"),
      topBy(ctx.db, "rapid"),
      topBy(ctx.db, "blitz"),
    ]);
    return { topClassic, topRapid, topBlitz };
  }),
});
