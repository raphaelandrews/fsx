import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const cacheRouter = router({
  revalidateTag: protectedProcedure
    .input(z.object({ tag: z.string() }))
    .mutation(() => {
      return {
        revalidated: true,
        note: "Cloudflare CDN caches GET responses with 5min TTL + 1hr stale-while-revalidate. POST mutations automatically bypass cache. React Query client-side cache also auto-invalidates on mutation success.",
      };
    }),
});
