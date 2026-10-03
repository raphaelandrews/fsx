import { publicProcedure, router } from "../index";

// The export must contain every player Swiss Manager may pair; the cap only
// guards against a runaway query and is far above the federation's roster.
const SWISS_MANAGER_EXPORT_LIMIT = 20_000;

// Public by the federation's decision: arbiters download it to pair tournaments,
// and Swiss Manager needs birth dates for age categories. The edge cache
// (PROCEDURE_CACHE_POLICY) and the uncached-read rate limit bound its D1 cost.
export const swissManagerRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
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
    return rows;
  }),
});
