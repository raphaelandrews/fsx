import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToTitles, insertPlayerToTitleSchema } from "@fsx/db/schema/playersToTitles";
import { adminProcedure, router } from "../index";

export const playersToTitlesRouter = router({
  listByPlayer: adminProcedure
    .input(z.object({ playerId: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToTitles.findMany({
        where: eq(playersToTitles.playerId, input.playerId),
        with: { title: true },
      })
    ),

  link: adminProcedure
    .input(insertPlayerToTitleSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToTitles).values(input).returning()
    ),

  unlink: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(playersToTitles).where(eq(playersToTitles.id, input.id))
    ),
});
