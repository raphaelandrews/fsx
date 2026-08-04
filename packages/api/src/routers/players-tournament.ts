import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToTournaments, insertPlayerToTournamentSchema } from "@fsx/db/schema/playersToTournaments";
import { protectedProcedure, router } from "../index";

export const playersTournamentRouter = router({
  link: protectedProcedure
    .input(insertPlayerToTournamentSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToTournaments).values(input).returning()
    ),
  updateRating: protectedProcedure
    .input(z.object({ id: z.number(), oldRating: z.number(), variation: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(playersToTournaments)
        .set({ oldRating: input.oldRating, variation: input.variation })
        .where(eq(playersToTournaments.id, input.id))
        .returning()
    ),
});
