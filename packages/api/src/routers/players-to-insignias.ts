import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToInsignias, insertPlayerToInsigniaSchema } from "@fsx/db/schema/playersToInsignias";
import { protectedProcedure, router } from "../index";

export const playersToInsigniasRouter = router({
  listByPlayer: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToInsignias.findMany({
        where: eq(playersToInsignias.playerId, input.playerId),
        with: { insignia: true },
      })
    ),

  link: protectedProcedure
    .input(insertPlayerToInsigniaSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToInsignias).values(input).returning()
    ),

  unlink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(playersToInsignias).where(eq(playersToInsignias.id, input.id))
    ),
});
