import { sql } from "drizzle-orm";

import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { publicProcedure, router } from "../index";

export const titledPlayersRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.players.findMany({
      columns: { id: true, name: true, imageUrl: true, rapid: true },
      with: {
        playersToTitles: {
          columns: {},
          with: {
            title: { columns: { name: true, shortName: true, type: true } },
          },
        },
      },
      where: (players, { exists }) =>
        exists(
          ctx.db
            .select()
            .from(playersToTitles)
            .where(sql`${playersToTitles.playerId} = ${players.id}`)
        ),
      orderBy: (players, { desc }) => [desc(players.rapid)],
    })
  ),
});
