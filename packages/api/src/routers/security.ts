import { count, max, min } from "drizzle-orm";

import { rateLimits } from "@fsx/db/schema/rateLimits";
import { adminProcedure, router } from "../index";

export const securityRouter = router({
  rateLimitStats: adminProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({
        rows: count(),
        oldestWindowStart: min(rateLimits.windowStart),
        newestWindowStart: max(rateLimits.windowStart),
      })
      .from(rateLimits);

    return {
      rows: result?.rows ?? 0,
      oldestWindowStart: result?.oldestWindowStart ?? null,
      newestWindowStart: result?.newestWindowStart ?? null,
    };
  }),
});
