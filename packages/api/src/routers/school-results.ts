import { z } from "zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import {
  AGE_GROUPS,
  INDIVIDUAL_MEDAL_WEIGHT,
  PLACE_POINTS,
  TEAM_MEDAL_WEIGHT,
  schoolResults,
} from "@fsx/db/schema/schoolResults";
import { clubs } from "@fsx/db/schema/clubs";
import { adminProcedure, publicProcedure, router } from "../index";

const ageGroupEnum = z.enum(AGE_GROUPS);
const sexEnum = z.enum(["male", "female"]);
const modalityEnum = z.enum(["individual", "team"]);

const resultInput = z
  .object({
    clubId: z.number(),
    playerId: z.number().nullable().optional(),
    teamName: z.string().nullable().optional(),
    ageGroup: ageGroupEnum,
    sex: sexEnum,
    modality: modalityEnum,
    place: z.number().int().min(1).max(8),
  })
  .superRefine((val, ctx) => {
    if (val.modality === "team" && !val.teamName) {
      ctx.addIssue({ code: "custom", message: "Nome da equipe é obrigatório para equipes", path: ["teamName"] });
    }
    if (val.modality === "individual" && !val.playerId) {
      ctx.addIssue({ code: "custom", message: "Jogador é obrigatório para individual", path: ["playerId"] });
    }
  });

const medalColumn = (place: number) =>
  sql<number>`sum(case when ${schoolResults.place} = ${place} then (case when ${schoolResults.modality} = 'team' then ${TEAM_MEDAL_WEIGHT} else ${INDIVIDUAL_MEDAL_WEIGHT} end) else 0 end)`;

export const schoolResultsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.schoolResults.findMany({
      with: {
        club: { columns: { id: true, name: true, logoUrl: true } },
        player: { columns: { id: true, name: true } },
      },
      orderBy: [asc(schoolResults.ageGroup), asc(schoolResults.sex), asc(schoolResults.modality), desc(schoolResults.points)],
    })
  ),
  leaderboard: publicProcedure
    .input(
      z.object({
        ageGroup: ageGroupEnum.optional(),
        sex: sexEnum.optional(),
        modality: modalityEnum.optional(),
      })
    )
    .query(({ ctx, input }) => {
      const conditions = [
        input.ageGroup ? eq(schoolResults.ageGroup, input.ageGroup) : undefined,
        input.sex ? eq(schoolResults.sex, input.sex) : undefined,
        input.modality ? eq(schoolResults.modality, input.modality) : undefined,
      ].filter(Boolean);
      return ctx.db
        .select({
          clubId: schoolResults.clubId,
          name: clubs.name,
          logoUrl: clubs.logoUrl,
          points: sql<number>`sum(${schoolResults.points})`,
          gold: medalColumn(1),
          silver: medalColumn(2),
          bronze: medalColumn(3),
        })
        .from(schoolResults)
        .innerJoin(clubs, eq(schoolResults.clubId, clubs.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .groupBy(schoolResults.clubId, clubs.name, clubs.logoUrl)
        .orderBy(desc(sql`points`))
    }),
  create: adminProcedure
    .input(resultInput)
    .mutation(({ ctx, input }) => {
      const points = PLACE_POINTS[input.place]!;
      return ctx.db
        .insert(schoolResults)
        .values({
          clubId: input.clubId,
          playerId: input.modality === "individual" ? input.playerId : null,
          teamName: input.modality === "team" ? input.teamName : null,
          ageGroup: input.ageGroup,
          sex: input.sex,
          modality: input.modality,
          place: input.place,
          points,
        })
        .returning();
    }),
  update: adminProcedure
    .input(resultInput.extend({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.db
        .update(schoolResults)
        .set({
          clubId: rest.clubId,
          playerId: rest.modality === "individual" ? rest.playerId : null,
          teamName: rest.modality === "team" ? rest.teamName : null,
          ageGroup: rest.ageGroup,
          sex: rest.sex,
          modality: rest.modality,
          place: rest.place,
          points: PLACE_POINTS[rest.place]!,
        })
        .where(eq(schoolResults.id, id))
        .returning();
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => ctx.db.delete(schoolResults).where(eq(schoolResults.id, input.id))),
  deleteAll: adminProcedure.mutation(({ ctx }) => ctx.db.delete(schoolResults)),
});