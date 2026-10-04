import { z } from "zod";
import { eq } from "drizzle-orm";

import { tournamentPodiums } from "@fsx/db/schema/tournamentPodiums";
import { adminProcedure, publicProcedure, router } from "../index";
import { idInput, positiveInt } from "../input-schemas";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";
import { COMPETITION_CATEGORIES } from "../circuit-types";

const podiumInput = z.object({
  playerId: positiveInt,
  tournamentId: positiveInt,
  place: positiveInt.max(100_000),
  category: z.enum(COMPETITION_CATEGORIES).nullable().optional(),
});

export const tournamentPodiumsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournamentPodiums.findMany({
      columns: { id: true, playerId: true, tournamentId: true, place: true, category: true },
      with: {
        player: { columns: { id: true, name: true } },
        tournament: { columns: { id: true, name: true } },
      },
       orderBy: (tp, { asc }) => [asc(tp.tournamentId), asc(tp.category), asc(tp.place), asc(tp.id)],
       limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  create: adminProcedure
    .input(podiumInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournamentPodiums).values({ ...input, category: input.category ?? null }).returning()
    ),
  update: adminProcedure
    .input(podiumInput.extend({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db
          .update(tournamentPodiums)
          .set({ playerId: input.playerId, tournamentId: input.tournamentId, place: input.place, category: input.category ?? null })
          .where(eq(tournamentPodiums.id, input.id))
          .returning(),
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
