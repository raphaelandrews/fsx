import { z } from "zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import {
  AGE_GROUPS,
  INDIVIDUAL_MEDAL_WEIGHT,
  PLACE_POINTS,
  TEAM_MEDAL_WEIGHT,
  TEAM_NAMES,
  tvSergipe,
} from "@fsx/db/schema/tv-sergipe";
import { clubs } from "@fsx/db/schema/clubs";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { idInput, positiveInt, sexSchema } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";

const ageGroupEnum = z.enum(AGE_GROUPS);
const modalityEnum = z.enum(["individual", "team"]);
const teamNameEnum = z.enum(TEAM_NAMES);

const resultInput = z
  .object({
    clubId: positiveInt,
    playerId: positiveInt.nullable().optional(),
    teamName: teamNameEnum.nullable().optional(),
    ageGroup: ageGroupEnum,
    sex: sexSchema,
    modality: modalityEnum,
    place: z.number().int().min(1).max(8),
  })
  .superRefine((val, ctx) => {
    if (val.modality === "individual" && !val.playerId) {
      ctx.addIssue({ code: "custom", message: "A player is required for individual results", path: ["playerId"] });
    }
    if (val.modality === "team" && !val.teamName) {
      ctx.addIssue({ code: "custom", message: "A team letter (A–J) is required for team results", path: ["teamName"] });
    }
  });

const medalColumn = (place: number) =>
  sql<number>`sum(case when ${tvSergipe.place} = ${place} then (case when ${tvSergipe.modality} = 'team' then ${TEAM_MEDAL_WEIGHT} else ${INDIVIDUAL_MEDAL_WEIGHT} end) else 0 end)`;

const resultRow = (input: z.infer<typeof resultInput>) => ({
  clubId: input.clubId,
  playerId: input.modality === "individual" ? input.playerId : null,
  teamName: input.modality === "team" ? input.teamName : null,
  ageGroup: input.ageGroup,
  sex: input.sex,
  modality: input.modality,
  place: input.place,
  points: PLACE_POINTS[input.place]!,
});

export const tvSergipeRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tvSergipe.findMany({
      columns: {
        id: true,
        clubId: true,
        playerId: true,
        teamName: true,
        ageGroup: true,
        sex: true,
        modality: true,
        place: true,
        points: true,
      },
      with: {
        club: { columns: { id: true, name: true } },
        player: { columns: { id: true, name: true } },
      },
       orderBy: [asc(tvSergipe.ageGroup), asc(tvSergipe.sex), asc(tvSergipe.modality), desc(tvSergipe.points), asc(tvSergipe.id)],
       limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  leaderboard: publicProcedure
    .input(
      z
        .object({
          ageGroup: ageGroupEnum.optional(),
          sex: sexSchema.optional(),
          modality: modalityEnum.optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { ageGroup, sex, modality } = input ?? {};
      const conditions = [
        ageGroup ? eq(tvSergipe.ageGroup, ageGroup) : undefined,
        sex ? eq(tvSergipe.sex, sex) : undefined,
        modality ? eq(tvSergipe.modality, modality) : undefined,
      ].filter(Boolean);
      return ctx.db
        .select({
          clubId: tvSergipe.clubId,
          name: clubs.name,
          logoUrl: clubs.logoUrl,
          points: sql<number>`sum(${tvSergipe.points})`,
          gold: medalColumn(1),
          silver: medalColumn(2),
          bronze: medalColumn(3),
        })
        .from(tvSergipe)
        .innerJoin(clubs, eq(tvSergipe.clubId, clubs.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .groupBy(tvSergipe.clubId, clubs.name, clubs.logoUrl)
        .orderBy(desc(sql`sum(${tvSergipe.points})`), asc(clubs.id))
        .limit(PUBLIC_COLLECTION_LIMIT)
    }),
  create: adminProcedure
    .input(resultInput)
    .mutation(({ ctx, input }) => ctx.db.insert(tvSergipe).values(resultRow(input)).returning()),
  update: adminProcedure
    .input(resultInput.extend({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(tvSergipe).set(resultRow(input)).where(eq(tvSergipe.id, input.id)).returning(),
        "School result",
      ),
    ),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(tvSergipe).where(eq(tvSergipe.id, input.id)).returning({ id: tvSergipe.id }),
        "School result",
      )
    ),
  deleteAll: adminProcedure.mutation(async ({ ctx }) => {
    const deleted = await ctx.db.delete(tvSergipe).returning({ id: tvSergipe.id });
    return { deleted: deleted.length };
  }),
});
