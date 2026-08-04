import { z } from "zod";
import { eq } from "drizzle-orm";

import { tournamentPodiums, insertTournamentPodiumSchema } from "@fsx/db/schema/tournamentPodiums";
import { protectedProcedure, publicProcedure, router } from "../index";

export const tournamentPodiumsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(tournamentPodiums)
  ),
  create: protectedProcedure
    .input(insertTournamentPodiumSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournamentPodiums).values(input).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(tournamentPodiums).where(eq(tournamentPodiums.id, input.id))
    ),
});
