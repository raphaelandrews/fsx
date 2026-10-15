import { z } from "zod";
import { asc, eq } from "drizzle-orm";

import { playersToTournaments } from "@fsx/db/schema/players-to-tournaments";

import { adminProcedure, router } from "../index";
import { idInput, positiveInt, rating, ratingTypeSchema } from "../input-schemas";
import { federationToday } from "../lib/dates";
import { MAX_RATING, RATING_TYPES } from "../rating-types";
import {
  applyRatingUpdate,
  correctRatingVariation,
  removeRatingResult,
  revertTournamentRatings,
  snapshotRankings,
} from "../services/rating-update";

const variation = z.number().int().safe().min(-MAX_RATING).max(MAX_RATING);

export const playersTournamentRouter = router({
  linkWithRating: adminProcedure
    .input(z.object({
      playerId: positiveInt,
      tournamentId: positiveInt,
      variation,
      ratingType: ratingTypeSchema,
    }))
    .mutation(({ ctx, input }) => applyRatingUpdate(ctx.db, input)),

  snapshotRankings: adminProcedure
    .input(z.object({ ratingTypes: z.array(ratingTypeSchema).min(1).max(RATING_TYPES.length) }))
    .mutation(({ ctx, input }) => snapshotRankings(ctx.db, input.ratingTypes, federationToday())),

  listByPlayer: adminProcedure
    .input(z.object({ playerId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToTournaments.findMany({
        where: eq(playersToTournaments.playerId, input.playerId),
        columns: { id: true, oldRating: true, variation: true, ratingType: true },
        with: { tournament: { columns: { id: true, name: true, date: true } } },
        orderBy: asc(playersToTournaments.id),
      })
    ),

  listByTournament: adminProcedure
    .input(z.object({ tournamentId: positiveInt }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToTournaments.findMany({
        where: eq(playersToTournaments.tournamentId, input.tournamentId),
        columns: { id: true, oldRating: true, variation: true },
        with: { player: { columns: { id: true, name: true } } },
        orderBy: asc(playersToTournaments.id),
      })
    ),

  correctVariation: adminProcedure
    .input(z.object({ id: positiveInt, variation, oldRating: rating.optional() }))
    .mutation(({ ctx, input }) => correctRatingVariation(ctx.db, input)),

  remove: adminProcedure
    .input(idInput)
    .mutation(({ ctx, input }) => removeRatingResult(ctx.db, input)),

  revertTournament: adminProcedure
    .input(z.object({ tournamentId: positiveInt }))
    .mutation(({ ctx, input }) => revertTournamentRatings(ctx.db, input)),
});
