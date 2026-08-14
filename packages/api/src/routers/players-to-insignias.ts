import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToInsignias, insertPlayerToInsigniaSchema } from "@fsx/db/schema/playersToInsignias";
import { adminProcedure, router } from "../index";

export const playersToInsigniasRouter = router({
  listByPlayer: adminProcedure
    .input(z.object({ playerId: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToInsignias.findMany({
        where: eq(playersToInsignias.playerId, input.playerId),
        with: { insignia: true },
      })
    ),

  link: adminProcedure
    .input(insertPlayerToInsigniaSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToInsignias).values(input).returning()
    ),

  unlink: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(playersToInsignias).where(eq(playersToInsignias.id, input.id))
    ),
});
