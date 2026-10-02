import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { publicProcedure, router } from "../index";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

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
      // IN (subquery) starts from the few title links and looks players up by
      // primary key; EXISTS walked every player in rating order.
      where: (players, { inArray }) =>
        inArray(players.id, ctx.db.select({ id: playersToTitles.playerId }).from(playersToTitles)),
      orderBy: (players, { desc, asc }) => [desc(players.rapid), asc(players.id)],
      limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
});
