import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import {
  AGE_GROUPS,
  INDIVIDUAL_MEDAL_WEIGHT,
  PLACE_POINTS,
  TEAM_MEDAL_WEIGHT,
  TEAM_NAMES,
  tvSergipe,
} from "@fsx/db/schema/tv-sergipe";
import { clubs } from "@fsx/db/schema/clubs";
import { scoringSchemePlaces } from "@fsx/db/schema/scoring-schemes";
import { tournaments } from "@fsx/db/schema/tournaments";
import type { Context } from "../context";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import {
  syncJustInsertedSchoolGamesResultPodium,
  syncSchoolGamesEditionPodiums,
  syncSchoolGamesResultPodium,
} from "../services/school-games-podium-sync";
import { idInput, positiveInt, sexSchema } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";

const ageGroupEnum = z.enum(AGE_GROUPS);
const modalityEnum = z.enum(["individual", "team"]);
const teamNameEnum = z.enum(TEAM_NAMES);

const resultInput = z
  .object({
    tournamentId: positiveInt,
    clubId: positiveInt,
    playerId: positiveInt.nullable().optional(),
    teamName: teamNameEnum.nullable().optional(),
    ageGroup: ageGroupEnum,
    sex: sexSchema,
    modality: modalityEnum,
    place: z.number().int().min(1).max(8),
    points: z.number().int().min(0).max(1000).optional(),
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

const editionFilter = z.object({ tournamentId: positiveInt.optional() }).optional();

// Points by place from the edition's scoring scheme; empty when it has none.
async function schemePoints(db: Context["db"], tournamentId: number) {
  const rows = await db
    .select({ place: scoringSchemePlaces.place, points: scoringSchemePlaces.points })
    .from(tournaments)
    .innerJoin(scoringSchemePlaces, eq(scoringSchemePlaces.schemeId, tournaments.scoringSchemeId))
    .where(eq(tournaments.id, tournamentId))
    .limit(MAX_SCHEME_PLACES);
  return new Map(rows.map((row) => [row.place, row.points]));
}

// Explicit points win; otherwise the edition's scoring scheme, then the original School Games table.
const pointsOf = (scheme: Map<number, number>, place: number, explicit?: number) =>
  explicit ?? scheme.get(place) ?? PLACE_POINTS[place]!;

const resultRow = (input: z.infer<typeof resultInput>, points: number) => ({
  tournamentId: input.tournamentId,
  clubId: input.clubId,
  playerId: input.modality === "individual" ? input.playerId : null,
  teamName: input.modality === "team" ? input.teamName : null,
  ageGroup: input.ageGroup,
  sex: input.sex,
  modality: input.modality,
  place: input.place,
  points,
});

const RESULT_COLUMNS = {
  id: true,
  tournamentId: true,
  clubId: true,
  playerId: true,
  teamName: true,
  ageGroup: true,
  sex: true,
  modality: true,
  place: true,
  points: true,
} as const;

const RESULT_ORDER = [asc(tvSergipe.ageGroup), asc(tvSergipe.sex), asc(tvSergipe.modality), desc(tvSergipe.points), asc(tvSergipe.id)];

const MAX_BULK_RESULTS = 100;
const MAX_SCHEME_PLACES = 50;

const bulkResultsInput = z
  .object({
    tournamentId: positiveInt,
    ageGroup: ageGroupEnum,
    sex: sexSchema,
    modality: modalityEnum,
    results: z
      .array(
        z.object({
          clubId: positiveInt,
          playerId: positiveInt.nullable().optional(),
          teamName: teamNameEnum.nullable().optional(),
          place: z.number().int().min(1).max(8),
          points: z.number().int().min(0).max(1000).optional(),
        }),
      )
      .min(1)
      .max(MAX_BULK_RESULTS),
  })
  .superRefine((value, ctx) => {
    value.results.forEach((result, index) => {
      if (value.modality === "individual" && !result.playerId) {
        ctx.addIssue({ code: "custom", message: "A player is required for individual results", path: ["results", index, "playerId"] });
      }
      if (value.modality === "team" && !result.teamName) {
        ctx.addIssue({ code: "custom", message: "A team letter (A–J) is required for team results", path: ["results", index, "teamName"] });
      }
    });
    const keys = value.results.map((result) =>
      value.modality === "individual" ? `p${result.playerId}` : `t${result.clubId}${result.teamName}`,
    );
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: "custom", message: "A player or team can appear only once per category.", path: ["results"] });
    }
  });

export const tvSergipeRouter = router({
  editions: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: tournaments.id, name: tournaments.name, date: tournaments.date })
      .from(tournaments)
      .where(sql`EXISTS (SELECT 1 FROM tv_sergipe WHERE tv_sergipe.tournament_id = ${tournaments.id})`)
      .orderBy(desc(tournaments.date), desc(tournaments.id))
      .limit(PUBLIC_COLLECTION_LIMIT),
  ),
  list: publicProcedure.input(editionFilter).query(({ ctx, input }) =>
    ctx.db.query.tvSergipe.findMany({
      where: input?.tournamentId ? eq(tvSergipe.tournamentId, input.tournamentId) : undefined,
      columns: RESULT_COLUMNS,
      with: { club: { columns: { id: true, name: true } }, player: { columns: { id: true, name: true } } },
      orderBy: RESULT_ORDER,
      limit: PUBLIC_COLLECTION_LIMIT,
    }),
  ),
  // The admin list names each result's edition; the public one leaves it out (it is filtered by one).
  listAdmin: adminProcedure.query(({ ctx }) =>
    ctx.db.query.tvSergipe.findMany({
      columns: RESULT_COLUMNS,
      with: {
        tournament: { columns: { id: true, name: true } },
        club: { columns: { id: true, name: true } },
        player: { columns: { id: true, name: true } },
      },
      orderBy: RESULT_ORDER,
      limit: PUBLIC_COLLECTION_LIMIT,
    }),
  ),
  leaderboard: publicProcedure
    .input(
      z
        .object({
          tournamentId: positiveInt.optional(),
          ageGroup: ageGroupEnum.optional(),
          sex: sexSchema.optional(),
          modality: modalityEnum.optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { tournamentId, ageGroup, sex, modality } = input ?? {};
      const conditions = [
        tournamentId ? eq(tvSergipe.tournamentId, tournamentId) : undefined,
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
  create: adminProcedure.input(resultInput).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db.batch([
      ctx.db.insert(tvSergipe).values(resultRow(input, pointsOf(await schemePoints(ctx.db, input.tournamentId), input.place, input.points))).returning(),
      ...syncJustInsertedSchoolGamesResultPodium(ctx.db),
    ]);
    return created;
  }),
  createMany: adminProcedure.input(bulkResultsInput).mutation(async ({ ctx, input }) => {
    const scheme = await schemePoints(ctx.db, input.tournamentId);
    const rows = input.results.map((result) =>
      resultRow({ ...input, ...result } as z.infer<typeof resultInput>, pointsOf(scheme, result.place, result.points)),
    );
    const inserts = rows.map((row) => ctx.db.insert(tvSergipe).values(row).returning({ id: tvSergipe.id }));
    const results = await ctx.db.batch([
      ...(inserts as [(typeof inserts)[number], ...(typeof inserts)[number][]]),
      ...syncSchoolGamesEditionPodiums(ctx.db, input.tournamentId),
    ]);
    return results.slice(0, inserts.length).flat();
  }),
  update: adminProcedure
    .input(resultInput.extend({ id: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db.batch([
        ctx.db.update(tvSergipe).set(resultRow(input, pointsOf(await schemePoints(ctx.db, input.tournamentId), input.place, input.points))).where(eq(tvSergipe.id, input.id)).returning(),
        ...syncSchoolGamesResultPodium(ctx.db, input.id),
      ]);
      return requireMutationRows(updated, "School result");
    }),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(tvSergipe).where(eq(tvSergipe.id, input.id)).returning({ id: tvSergipe.id }),
        "School result",
      )
    ),
  assignEdition: adminProcedure
    .input(z.object({ tournamentId: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      requireFound(
        await ctx.db.query.tournaments.findFirst({ where: eq(tournaments.id, input.tournamentId), columns: { id: true } }),
        "Tournament",
      );
      const [assigned] = await ctx.db.batch([
        ctx.db
          .update(tvSergipe)
          .set({ tournamentId: input.tournamentId })
          .where(isNull(tvSergipe.tournamentId))
          .returning({ id: tvSergipe.id }),
        ...syncSchoolGamesEditionPodiums(ctx.db, input.tournamentId),
      ]);
      if (assigned.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No results without an edition." });
      }
      return { assigned: assigned.length };
    }),
});
