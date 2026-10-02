import { z } from "zod";
import { eq } from "drizzle-orm";

import { tournamentPodiums, insertTournamentPodiumSchema } from "@fsx/db/schema/tournamentPodiums";
import { adminProcedure, publicProcedure, router } from "../index";
import { idInput, positiveInt } from "../input-schemas";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

export const tournamentPodiumsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournamentPodiums.findMany({
      columns: { id: true, playerId: true, tournamentId: true, place: true },
      with: {
        player: { columns: { id: true, name: true } },
        tournament: { columns: { id: true, name: true } },
      },
       orderBy: (tp, { asc }) => [asc(tp.tournamentId), asc(tp.place), asc(tp.id)],
       limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  create: adminProcedure
    .input(insertTournamentPodiumSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      playerId: positiveInt,
      tournamentId: positiveInt,
      place: positiveInt.max(100_000),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournamentPodiums).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: positiveInt, playerId: positiveInt, tournamentId: positiveInt, place: positiveInt.max(100_000) }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(tournamentPodiums).set({ playerId: input.playerId, tournamentId: input.tournamentId, place: input.place }).where(eq(tournamentPodiums.id, input.id)).returning(),
        "Tournament podium",
      )
    ),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(tournamentPodiums).where(eq(tournamentPodiums.id, input.id)).returning({ id: tournamentPodiums.id }),
        "Tournament podium",
      )
    ),
});
