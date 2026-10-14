import { z } from "zod";
import { asc, eq } from "drizzle-orm";

import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { adminProcedure, publicProcedure, router } from "../index";
import { idInput, positiveInt } from "../input-schemas";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { COMPETITION_CATEGORIES } from "../circuit-types";

const podiumInput = z.object({
  playerId: positiveInt,
  tournamentId: positiveInt,
  place: positiveInt.max(100_000),
  category: z.enum(COMPETITION_CATEGORIES).nullable().optional(),
});

const MAX_BULK_PODIUMS = 50;

const bulkPodiumsInput = z
  .object({
    tournamentId: positiveInt,
    podiums: z
      .array(
        z.object({
          playerId: positiveInt,
          place: positiveInt.max(100_000),
          category: z.enum(COMPETITION_CATEGORIES).nullable().optional(),
        }),
      )
      .min(1)
      .max(MAX_BULK_PODIUMS),
  })
  .refine(
    ({ podiums }) =>
      new Set(podiums.map((p) => `${p.playerId}:${p.category ?? ""}`)).size === podiums.length,
    { message: "A player can appear only once per category.", path: ["podiums"] },
  );

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
  listByTournament: adminProcedure
    .input(z.object({ tournamentId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.tournamentPodiums.findMany({
        where: eq(tournamentPodiums.tournamentId, input.tournamentId),
        columns: { id: true, playerId: true, place: true, category: true },
        with: { player: { columns: { id: true, name: true } } },
        orderBy: [asc(tournamentPodiums.category), asc(tournamentPodiums.place), asc(tournamentPodiums.id)],
        limit: PUBLIC_COLLECTION_LIMIT,
      })
    ),
  createMany: adminProcedure
    .input(bulkPodiumsInput)
    .mutation(async ({ ctx, input }) => {
      const inserts = input.podiums.map((podium) =>
        ctx.db
          .insert(tournamentPodiums)
          .values({ ...podium, tournamentId: input.tournamentId, category: podium.category ?? null })
          .returning({ id: tournamentPodiums.id }),
      );
      const results = await ctx.db.batch(inserts as [(typeof inserts)[number], ...(typeof inserts)[number][]]);
      return results.flat();
    }),
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
