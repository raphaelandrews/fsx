import { z } from "zod";
import { asc, eq } from "drizzle-orm";

import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";

import { adminProcedure, router } from "../index";
import { positiveInt } from "../input-schemas";

import {
  applyRatingUpdate,
  correctRatingVariation,
  RATING_TYPES,
  removeRatingResult,
  revertTournamentRatings,
  snapshotRankings,
} from "./rating-update";

const ratingTypeEnum = z.enum(RATING_TYPES);

// The federation's calendar day, not UTC's, around midnight.
const federationToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const variation = z.number().int().safe().min(-4000).max(4000);

export const playersTournamentRouter = router({
  linkWithRating: adminProcedure
    .input(z.object({
      playerId: positiveInt,
      tournamentId: positiveInt,
      variation,
      ratingType: ratingTypeEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      return applyRatingUpdate(ctx.db, input);
    }),

  snapshotRankings: adminProcedure
    .input(z.object({ ratingTypes: z.array(ratingTypeEnum).min(1).max(RATING_TYPES.length) }))
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
    .input(z.object({ id: positiveInt, variation }))
    .mutation(({ ctx, input }) => correctRatingVariation(ctx.db, input)),

  remove: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(({ ctx, input }) => removeRatingResult(ctx.db, input)),

  revertTournament: adminProcedure
    .input(z.object({ tournamentId: positiveInt }))
    .mutation(({ ctx, input }) => revertTournamentRatings(ctx.db, input)),
});
