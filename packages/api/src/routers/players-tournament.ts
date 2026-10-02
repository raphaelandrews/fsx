import { z } from "zod";

import { adminProcedure, router } from "../index";
import { positiveInt } from "../input-schemas";

import { applyRatingUpdate, RATING_TYPES } from "./rating-update";

const ratingTypeEnum = z.enum(RATING_TYPES);

export const playersTournamentRouter = router({
  linkWithRating: adminProcedure
    .input(z.object({
      playerId: positiveInt,
      tournamentId: positiveInt,
      variation: z.number().int().safe().min(-4000).max(4000),
      ratingType: ratingTypeEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      return applyRatingUpdate(ctx.db, input);
    }),
});
