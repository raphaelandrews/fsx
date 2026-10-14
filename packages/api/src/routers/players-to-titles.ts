import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToTitles, insertPlayerToTitleSchema } from "@fsx/db/schema/players-to-titles";
import { adminProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { idInput, positiveInt } from "../input-schemas";
import { PUBLIC_NESTED_COLLECTION_LIMIT } from "../lib/resource-bounds";

export const playersToTitlesRouter = router({
  listByPlayer: adminProcedure
    .input(z.object({ playerId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToTitles.findMany({
        limit: PUBLIC_NESTED_COLLECTION_LIMIT,
        where: eq(playersToTitles.playerId, input.playerId),
        with: { title: true },
      })
    ),

  link: adminProcedure
    .input(insertPlayerToTitleSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      playerId: positiveInt,
      titleId: positiveInt,
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToTitles).values(input).returning()
    ),

  unlink: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(playersToTitles).where(eq(playersToTitles.id, input.id)).returning({ id: playersToTitles.id }),
        "Player title",
      )
    ),
});
