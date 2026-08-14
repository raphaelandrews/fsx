import { z } from "zod";
import { eq } from "drizzle-orm";

import { tournamentPodiums, insertTournamentPodiumSchema } from "@fsx/db/schema/tournamentPodiums";
import { adminProcedure, publicProcedure, router } from "../index";

export const tournamentPodiumsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournamentPodiums.findMany({
      columns: { id: true, playerId: true, tournamentId: true, place: true },
      with: {
        player: { columns: { id: true, name: true } },
        tournament: { columns: { id: true, name: true } },
      },
      orderBy: (tp, { asc }) => asc(tp.tournamentId),
    })
  ),
  create: adminProcedure
    .input(insertTournamentPodiumSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournamentPodiums).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), playerId: z.number(), tournamentId: z.number(), place: z.number().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(tournamentPodiums).set({ playerId: input.playerId, tournamentId: input.tournamentId, place: input.place }).where(eq(tournamentPodiums.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(tournamentPodiums).where(eq(tournamentPodiums.id, input.id))
    ),
});
