import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const cacheRouter = router({
  revalidateTag: protectedProcedure
    .input(z.object({ tag: z.string() }))
    .mutation(() => {
      return { revalidated: true };
    }),
});
