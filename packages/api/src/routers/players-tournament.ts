import { z } from "zod";
import { eq } from "drizzle-orm";

import { players } from "@fsx/db/schema/players";
import { playersToTournaments, insertPlayerToTournamentSchema } from "@fsx/db/schema/playersToTournaments";
import { tournaments } from "@fsx/db/schema/tournaments";
import { adminProcedure, router } from "../index";

import { TRPCError } from "@trpc/server";

const ratingTypes = ["blitz", "rapid", "classic"] as const;

export const playersTournamentRouter = router({
  link: adminProcedure
    .input(insertPlayerToTournamentSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToTournaments).values(input).returning()
    ),
  updateRating: adminProcedure
    .input(z.object({ id: z.number(), oldRating: z.number(), variation: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(playersToTournaments)
        .set({ oldRating: input.oldRating, variation: input.variation })
        .where(eq(playersToTournaments.id, input.id))
        .returning()
    ),
  linkWithRating: adminProcedure
    .input(z.object({
      playerId: z.number(),
      tournamentId: z.number(),
      variation: z.number(),
      ratingType: z.enum(ratingTypes),
    }))
    .mutation(async ({ ctx, input }) => {
      const { playerId, tournamentId, variation, ratingType } = input;

      const tournament = await ctx.db.query.tournaments.findFirst({
        where: eq(tournaments.id, tournamentId),
      });
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });

      const player = await ctx.db.query.players.findFirst({
        where: eq(players.id, playerId),
        columns: { id: true, blitz: true, rapid: true, classic: true },
      });
      if (!player) throw new TRPCError({ code: "NOT_FOUND", message: "Player not found" });

      const currentRating = player[ratingType];
      const newRating = currentRating + variation;

      await ctx.db.update(players)
        .set({ [ratingType]: newRating })
        .where(eq(players.id, playerId));

      return ctx.db.insert(playersToTournaments).values({
        playerId,
        tournamentId,
        oldRating: currentRating,
        variation,
      }).returning();
    }),
});
