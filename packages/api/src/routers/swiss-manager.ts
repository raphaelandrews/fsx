import { adminProcedure, router } from "../index";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

export const swissManagerRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const startedAt = new Date().toISOString();
    try {
      const rows = await ctx.db.query.players.findMany({
        columns: { id: true, name: true, sex: true, birthDate: true, classic: true, rapid: true, blitz: true },
        with: { club: { columns: { id: true, name: true } } },
        orderBy: (players, { desc, asc }) => [desc(players.rapid), asc(players.id)],
        limit: PUBLIC_COLLECTION_LIMIT,
      });
      console.info("[audit] sensitive export", {
        actorId: ctx.session.user.id,
        procedure: "swissManager.list",
        requestId: ctx.requestId,
        requestedAt: startedAt,
        result: "success",
        rowCount: rows.length,
      });
      return rows;
    } catch (error) {
      console.info("[audit] sensitive export", {
        actorId: ctx.session.user.id,
        procedure: "swissManager.list",
        requestId: ctx.requestId,
        requestedAt: startedAt,
        result: "failure",
      });
      throw error;
    }
  }),
});
