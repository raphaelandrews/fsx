import { z } from "zod";
import { asc, eq, sql } from "drizzle-orm";

import { scoringSchemePlaces, scoringSchemes } from "@fsx/db/schema/scoring-schemes";
import { adminProcedure, router } from "../index";
import { idInput, nameText, positiveInt } from "../input-schemas";
import { requireFound, requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { assertDeletable } from "../services/delete-impact";

const MAX_SCHEME_PLACES = 50;

const schemeInput = z
  .object({
    name: nameText,
    places: z
      .array(z.object({ place: positiveInt.max(1000), points: z.number().int().min(0).max(1_000_000) }))
      .min(1)
      .max(MAX_SCHEME_PLACES),
  })
  .refine(({ places }) => new Set(places.map((entry) => entry.place)).size === places.length, {
    message: "Each place can appear only once.",
    path: ["places"],
  });

export const scoringSchemesRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.query.scoringSchemes.findMany({
      columns: { id: true, name: true },
      with: { places: { columns: { place: true, points: true }, orderBy: (place, { asc }) => [asc(place.place)] } },
      orderBy: [asc(scoringSchemes.name), asc(scoringSchemes.id)],
      limit: PUBLIC_COLLECTION_LIMIT,
    }),
  ),
  create: adminProcedure.input(schemeInput).mutation(async ({ ctx, input }) => {
    const schemeId = sql`(SELECT ${scoringSchemes.id} FROM ${scoringSchemes} WHERE ${scoringSchemes.name} = ${input.name})`;
    const [created] = await ctx.db.batch([
      ctx.db.insert(scoringSchemes).values({ name: input.name }).returning(),
      ...input.places.map((entry) => ctx.db.insert(scoringSchemePlaces).values({ schemeId, ...entry })),
    ]);
    return created;
  }),
  update: adminProcedure.input(schemeInput.and(z.object({ id: positiveInt }))).mutation(async ({ ctx, input }) => {
    requireFound(
      await ctx.db.query.scoringSchemes.findFirst({ where: eq(scoringSchemes.id, input.id), columns: { id: true } }),
      "Scoring scheme",
    );
    const [updated] = await ctx.db.batch([
      ctx.db.update(scoringSchemes).set({ name: input.name }).where(eq(scoringSchemes.id, input.id)).returning(),
      ctx.db.delete(scoringSchemePlaces).where(eq(scoringSchemePlaces.schemeId, input.id)),
      ...input.places.map((entry) => ctx.db.insert(scoringSchemePlaces).values({ schemeId: input.id, ...entry })),
    ]);
    return requireMutationRows(updated, "Scoring scheme");
  }),
  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await assertDeletable(ctx.db, "scoringScheme", input.id);
    return requireMutationRows(
      await ctx.db.delete(scoringSchemes).where(eq(scoringSchemes.id, input.id)).returning({ id: scoringSchemes.id }),
      "Scoring scheme",
    );
  }),
});
