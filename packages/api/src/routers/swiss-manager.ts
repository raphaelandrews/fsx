import { adminProcedure, router } from "../index";

// The export must contain every player Swiss Manager may pair; the cap only
// guards against a runaway query and is far above the federation's roster.
const SWISS_MANAGER_EXPORT_LIMIT = 20_000;

export const swissManagerRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const startedAt = new Date().toISOString();
    try {
      const rows = await ctx.db.query.players.findMany({
        columns: { id: true, name: true, sex: true, birthDate: true, classic: true, rapid: true, blitz: true },
        with: { club: { columns: { id: true, name: true } } },
        orderBy: (players, { desc, asc }) => [desc(players.rapid), asc(players.id)],
        limit: SWISS_MANAGER_EXPORT_LIMIT,
      });
      if (rows.length >= SWISS_MANAGER_EXPORT_LIMIT) {
        console.warn("[resource] swiss manager export hit its row cap", {
          requestId: ctx.requestId,
          limit: SWISS_MANAGER_EXPORT_LIMIT,
        });
      }
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
