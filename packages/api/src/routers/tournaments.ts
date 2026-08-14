import { z } from "zod";
import { eq } from "drizzle-orm";

import { tournaments, insertTournamentSchema } from "@fsx/db/schema/tournaments";
import { adminProcedure, publicProcedure, router } from "../index";

export const tournamentsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournaments.findMany({
      columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true },
      with: {
        championship: { columns: { id: true, name: true } },
      },
      orderBy: (tournaments, { desc }) => [desc(tournaments.date)],
    })
  ),
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.id),
        columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true },
        with: {
          championship: { columns: { id: true, name: true } },
          tournamentPodiums: {
            columns: { id: true, place: true, playerId: true },
            with: {
              player: { columns: { id: true, name: true, nickname: true, imageUrl: true } },
            },
          },
        },
      })
    ),
  create: adminProcedure
    .input(insertTournamentSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournaments).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      chessResults: z.string().nullable().optional(),
      date: z.string().nullable().optional(),
      ratingType: z.string().optional(),
      championshipId: z.number().nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(tournaments).set(input).where(eq(tournaments.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(tournaments).where(eq(tournaments.id, input.id))
    ),
});
