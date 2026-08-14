import { publicProcedure, router } from "../index";

export const swissManagerRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.players.findMany({
      columns: { id: true, name: true, sex: true, birthDate: true, classic: true, rapid: true, blitz: true },
      with: { club: { columns: { id: true, name: true } } },
      orderBy: (players, { desc }) => [desc(players.rapid)],
    })
  ),
});
