import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToInsignias, insertPlayerToInsigniaSchema } from "@fsx/db/schema/playersToInsignias";
import { adminProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { positiveInt } from "../input-schemas";
import { PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

export const playersToInsigniasRouter = router({
  listByPlayer: adminProcedure
    .input(z.object({ playerId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToInsignias.findMany({
        limit: PUBLIC_NESTED_COLLECTION_LIMIT,
        where: eq(playersToInsignias.playerId, input.playerId),
        with: { insignia: true },
      })
    ),

  link: adminProcedure
    .input(insertPlayerToInsigniaSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      playerId: positiveInt,
      insigniaId: positiveInt,
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToInsignias).values(input).returning()
    ),

  unlink: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(playersToInsignias).where(eq(playersToInsignias.id, input.id)).returning({ id: playersToInsignias.id }),
        "Player insignia",
      )
    ),
});
