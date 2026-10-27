import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { circuitFinalPodiums } from "@fsx/db/schema/circuit-final-podiums";
import { circuitPhases } from "@fsx/db/schema/circuit-phases";
import { circuitResults } from "@fsx/db/schema/circuit-results";
import { circuits } from "@fsx/db/schema/circuits";
import { COMPETITION_TIERS, CIRCUIT_TYPES, MEDAL_PLACES, type CircuitType } from "../circuit-types";
import { circuitFinalPodiums as rankFinalPodiums } from "../circuit-standings";
import type { Context } from "../context";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { assertDeletable } from "../services/delete-impact";
import { syncCircuitResults, syncJustInsertedStageResultPodium, syncPhasePodiums, syncStageResultPodium } from "../services/stage-podium-sync";
import { categoryName, idInput, isoDate, nameText, points, positiveInt, seasonYear, sortOrder } from "../input-schemas";
import { requireCategories } from "../services/categories";
import {
  assertCategoriesCoverResults,
  circuitOfPhase,
  replaceCircuitCategories,
  requireCircuitCategory,
} from "../services/circuit-categories";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../lib/resource-bounds";

const circuitTypeEnum = z.enum(CIRCUIT_TYPES);

// A season's points rows across all stages; far above any real circuit.
const CIRCUIT_POINTS_LIMIT = 20_000;

const circuitInput = z.object({
  name: nameText,
  type: circuitTypeEnum,
  year: seasonYear,
  tier: z.enum(COMPETITION_TIERS).default("B"),
  championshipId: positiveInt.nullable().optional(),
  scoringSchemeId: positiveInt.nullable().optional(),
  // The categories this circuit uses; empty means any. Omitted on update leaves the list as it is.
  categories: z.array(categoryName).max(30).optional(),
});

const finalPodiumInput = z.object({
  playerId: positiveInt,
  category: categoryName.nullable().optional(),
  place: positiveInt.max(1000),
  points: z.number().min(0).max(1_000_000).nullable().optional(),
});

const playerColumns = {
  columns: { id: true, name: true, nickname: true, imageUrl: true },
  with: {
    club: { columns: { id: true, name: true, logoUrl: true } },
    playersToTitles: {
      columns: {},
      with: { title: { columns: { shortName: true, type: true } } },
    },
  },
} as const;

const phaseInput = z.object({
  circuitId: positiveInt,
  tournamentId: positiveInt,
  clubId: positiveInt.nullable().optional(),
  sortOrder,
});

const podiumInput = z.object({
  playerId: positiveInt,
  circuitId: positiveInt.nullable().optional(),
  circuitPhaseId: positiveInt.nullable().optional(),
  category: categoryName.nullable().optional(),
  place: positiveInt.max(1000).nullable().optional(),
  points,
});

const MAX_BULK_RESULTS = 100;

const bulkResultsInput = z
  .object({
    circuitPhaseId: positiveInt,
    category: categoryName.nullable().optional(),
    results: z
      .array(z.object({ playerId: positiveInt, place: positiveInt.max(1000).nullable().optional(), points }))
      .min(1)
      .max(MAX_BULK_RESULTS),
  })
  .refine(({ results }) => new Set(results.map((result) => result.playerId)).size === results.length, {
    message: "A player can appear only once per category.",
    path: ["results"],
  });

const hasSinglePodiumTarget = (value: {
  circuitId?: number | null;
  circuitPhaseId?: number | null;
}) => (value.circuitId != null) !== (value.circuitPhaseId != null);

export const circuitsRouter = router({
  byId: publicProcedure.input(idInput).query(async ({ ctx, input }) =>
    requireFound(await ctx.db.query.circuits.findFirst({
      where: eq(circuits.id, input.id),
      columns: { id: true, name: true, type: true, year: true, tier: true, championshipId: true, scoringSchemeId: true, finishedAt: true },
      with: {
        championship: { columns: { id: true, name: true } },
        circuitCategories: { columns: { category: true } },
        scoringScheme: {
          columns: { id: true, name: true },
          with: { places: { columns: { place: true, points: true }, orderBy: (place, { asc }) => [asc(place.place)] } },
        },
        circuitFinalPodiums: {
          limit: PUBLIC_NESTED_COLLECTION_LIMIT,
          columns: { id: true, category: true, place: true, points: true, playerId: true },
          orderBy: (podium, { asc }) => [asc(podium.category), asc(podium.place), asc(podium.id)],
          with: { player: playerColumns },
        },
        circuitPhases: {
          limit: PUBLIC_NESTED_COLLECTION_LIMIT,
          columns: { id: true, sortOrder: true, tournamentId: true, clubId: true },
          orderBy: (phase, { asc }) => [asc(phase.sortOrder), asc(phase.id)],
          with: {
            tournament: { columns: { id: true, name: true } },
            club: { columns: { id: true, name: true } },
            circuitResults: {
              limit: PUBLIC_NESTED_COLLECTION_LIMIT,
              columns: { id: true, category: true, place: true, points: true, playerId: true },
              orderBy: (podium, { asc, desc }) => [desc(podium.points), asc(podium.id)],
              with: { player: playerColumns },
            },
          },
        },
        circuitResults: {
          limit: PUBLIC_NESTED_COLLECTION_LIMIT,
          columns: { id: true, category: true, place: true, points: true, playerId: true },
          orderBy: (podium, { asc, desc }) => [desc(podium.points), asc(podium.id)],
          with: { player: playerColumns },
        },
      },
    }), "Circuit"),
  ),
  listSimple: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: circuits.id,
        name: circuits.name,
        type: circuits.type,
        year: circuits.year,
        tier: circuits.tier,
        finishedAt: circuits.finishedAt,
      })
      .from(circuits)
      .orderBy(desc(circuits.year), asc(circuits.name), asc(circuits.id))
      .limit(PUBLIC_COLLECTION_LIMIT),
  ),
  create: adminProcedure.input(circuitInput).mutation(async ({ ctx, input }) => {
    const { categories: allowed = [], ...circuit } = input;
    await requireCategories(ctx.db, allowed);
    const [created] = await ctx.db.batch([
      ctx.db
        .insert(circuits)
        .values({ ...circuit, championshipId: circuit.championshipId ?? null, scoringSchemeId: circuit.scoringSchemeId ?? null })
        .returning(),
      ...replaceCircuitCategories(ctx.db, { name: circuit.name }, allowed),
    ]);
    return created;
  }),
  update: adminProcedure.input(circuitInput.extend({ id: positiveInt })).mutation(async ({ ctx, input }) => {
    if (input.categories) {
      await requireCategories(ctx.db, input.categories);
      await assertCategoriesCoverResults(ctx.db, input.id, input.categories);
    }
    const [updated] = await ctx.db.batch([
      ctx.db
        .update(circuits)
        .set({
          name: input.name,
          type: input.type,
          year: input.year,
          tier: input.tier,
          championshipId: input.championshipId ?? null,
          scoringSchemeId: input.scoringSchemeId ?? null,
        })
        .where(eq(circuits.id, input.id))
        .returning(),
      ...(input.categories ? replaceCircuitCategories(ctx.db, input.id, input.categories) : []),
    ]);
    return requireMutationRows(updated, "Circuit");
  }),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      await assertDeletable(ctx.db, "circuit", input.id);
      return requireMutationRows(
        await ctx.db.delete(circuits).where(eq(circuits.id, input.id)).returning({ id: circuits.id }),
        "Circuit",
      );
    }),
  finish: adminProcedure
    .input(z.object({ id: positiveInt, finishedAt: isoDate }))
    .mutation(async ({ ctx, input }) => {
      const circuit = requireFound(
        await ctx.db.query.circuits.findFirst({
          where: eq(circuits.id, input.id),
          columns: { id: true, type: true, finishedAt: true },
        }),
        "Circuit",
      );
      if (circuit.finishedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This circuit is already finished. Reopen it to recompute its final podiums.",
        });
      }
      const placings = rankFinalPodiums(circuit.type as CircuitType, await circuitPoints(ctx.db, circuit));
      if (placings.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This circuit has no points to rank yet." });
      }
      const [finished] = await ctx.db.batch([
        ctx.db
          .update(circuits)
          .set({ finishedAt: input.finishedAt })
          .where(and(eq(circuits.id, input.id), isNull(circuits.finishedAt)))
          .returning({ id: circuits.id }),
        ...placings.map((placing) => ctx.db.insert(circuitFinalPodiums).values({ circuitId: input.id, ...placing })),
      ]);
      return requireMutationRows(finished, "Circuit");
    }),
  reopen: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [, reopened] = await ctx.db.batch([
      ctx.db.delete(circuitFinalPodiums).where(eq(circuitFinalPodiums.circuitId, input.id)),
      ctx.db.update(circuits).set({ finishedAt: null }).where(eq(circuits.id, input.id)).returning({ id: circuits.id }),
    ]);
    return requireMutationRows(reopened, "Circuit");
  }),
  // Stage results in medal places that have no tournament podium yet (saved before the sync, or
  // while podiums were off). "Sync medals" fixes them.
  medalGaps: adminProcedure.input(idInput).query(async ({ ctx, input }) => {
    const [row] = await ctx.db.all<{ count: number }>(sql`
      SELECT COUNT(*) AS count
      FROM circuit_results r
      JOIN circuit_phases ph ON ph.id = r.circuit_phase_id
      JOIN tournaments t ON t.id = ph.tournament_id
      WHERE ph.circuit_id = ${input.id}
        AND t.has_podiums = 1
        AND r.place BETWEEN 1 AND ${MEDAL_PLACES}
        AND NOT EXISTS (
          SELECT 1 FROM tournament_podiums tp
          WHERE tp.circuit_result_id = r.id
            OR (tp.player_id = r.player_id AND tp.tournament_id = ph.tournament_id AND tp.category IS r.category)
        )`);
    return { missing: row?.count ?? 0 };
  }),
  syncPodiums: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    requireFound(
      await ctx.db.query.circuits.findFirst({ where: eq(circuits.id, input.id), columns: { id: true } }),
      "Circuit",
    );
    await ctx.db.batch([...syncCircuitResults(ctx.db, input.id)]);
    return { id: input.id };
  }),
  finalPodiums: router({
    create: adminProcedure
      .input(finalPodiumInput.extend({ circuitId: positiveInt }))
      .mutation(async ({ ctx, input }) => {
        const circuit = requireFound(
          await ctx.db.query.circuits.findFirst({
            where: eq(circuits.id, input.circuitId),
            columns: { finishedAt: true },
          }),
          "Circuit",
        );
        await requireCategories(ctx.db, [input.category]);
        await requireCircuitCategory(ctx.db, input.circuitId, input.category);
        if (!circuit.finishedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Finish the circuit before adding final podiums.",
          });
        }
        return ctx.db
          .insert(circuitFinalPodiums)
          .values({
            circuitId: input.circuitId,
            playerId: input.playerId,
            category: input.category ?? null,
            place: input.place,
            points: input.points ?? null,
          })
          .returning();
      }),
    update: adminProcedure
      .input(finalPodiumInput.extend({ id: positiveInt }))
      .mutation(async ({ ctx, input }) => {
        await requireCategories(ctx.db, [input.category]);
        const [podium] = await ctx.db
          .select({ circuitId: circuitFinalPodiums.circuitId })
          .from(circuitFinalPodiums)
          .where(eq(circuitFinalPodiums.id, input.id))
          .limit(1);
        await requireCircuitCategory(ctx.db, podium?.circuitId, input.category);
        return requireMutationRows(
          await ctx.db
            .update(circuitFinalPodiums)
            .set({
              playerId: input.playerId,
              category: input.category ?? null,
              place: input.place,
              points: input.points ?? null,
            })
            .where(eq(circuitFinalPodiums.id, input.id))
            .returning(),
          "Final podium",
        );
      }),
    delete: adminProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
          await ctx.db
            .delete(circuitFinalPodiums)
            .where(eq(circuitFinalPodiums.id, input.id))
            .returning({ id: circuitFinalPodiums.id }),
          "Final podium",
        )
      ),
  }),
  phases: router({
    listByTournament: adminProcedure
      .input(z.object({ tournamentId: positiveInt }))
      .query(({ ctx, input }) =>
        ctx.db
          .select({
            id: circuitPhases.id,
            sortOrder: circuitPhases.sortOrder,
            circuit: { id: circuits.id, name: circuits.name, year: circuits.year },
          })
          .from(circuitPhases)
          .innerJoin(circuits, eq(circuits.id, circuitPhases.circuitId))
          .where(eq(circuitPhases.tournamentId, input.tournamentId))
          .orderBy(desc(circuits.year), asc(circuits.name), asc(circuitPhases.sortOrder), asc(circuitPhases.id))
          .limit(PUBLIC_NESTED_COLLECTION_LIMIT),
      ),
    create: adminProcedure.input(phaseInput).mutation(({ ctx, input }) =>
      ctx.db
        .insert(circuitPhases)
        .values({
          circuitId: input.circuitId,
          tournamentId: input.tournamentId,
          clubId: input.clubId ?? null,
          sortOrder: input.sortOrder,
        })
        .returning(),
    ),
    update: adminProcedure
      .input(
        z.object({
          id: positiveInt,
          tournamentId: positiveInt,
          clubId: positiveInt.nullable().optional(),
          sortOrder,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db.batch([
          ctx.db
            .update(circuitPhases)
            .set({
              tournamentId: input.tournamentId,
              clubId: input.clubId ?? null,
              sortOrder: input.sortOrder,
            })
            .where(eq(circuitPhases.id, input.id))
            .returning(),
          ...syncPhasePodiums(ctx.db, input.id),
        ]);
        return requireMutationRows(updated, "Circuit phase");
      }),
    delete: adminProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
          await ctx.db.delete(circuitPhases).where(eq(circuitPhases.id, input.id)).returning({ id: circuitPhases.id }),
          "Circuit phase",
        )
      ),
  }),
  results: router({
    createMany: adminProcedure.input(bulkResultsInput).mutation(async ({ ctx, input }) => {
      await requireCategories(ctx.db, [input.category]);
      await requireCircuitCategory(ctx.db, await circuitOfPhase(ctx.db, input.circuitPhaseId), input.category);
      const inserts = input.results.map((result) =>
        ctx.db
          .insert(circuitResults)
          .values({
            playerId: result.playerId,
            circuitPhaseId: input.circuitPhaseId,
            category: input.category ?? null,
            place: result.place ?? null,
            points: result.points,
          })
          .returning({ id: circuitResults.id }),
      );
      const results = await ctx.db.batch([
        ...(inserts as [(typeof inserts)[number], ...(typeof inserts)[number][]]),
        ...syncPhasePodiums(ctx.db, input.circuitPhaseId),
      ]);
      return results.slice(0, inserts.length).flat();
    }),
    create: adminProcedure
      .input(
        podiumInput.refine(hasSinglePodiumTarget, {
          message: "Podium must target either a circuit or a phase, not both",
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await requireCategories(ctx.db, [input.category]);
        await requireCircuitCategory(ctx.db, input.circuitId ?? (await circuitOfPhase(ctx.db, input.circuitPhaseId!)), input.category);
        const [created] = await ctx.db.batch([
          ctx.db
            .insert(circuitResults)
            .values({
              playerId: input.playerId,
              circuitId: input.circuitId ?? null,
              circuitPhaseId: input.circuitPhaseId ?? null,
              category: input.category ?? null,
              place: input.place ?? null,
              points: input.points,
            })
            .returning(),
          ...syncJustInsertedStageResultPodium(ctx.db),
        ]);
        return created;
      }),
    update: adminProcedure
      .input(
        podiumInput.extend({ id: positiveInt }).refine(hasSinglePodiumTarget, {
          message: "Podium must target either a circuit or a phase, not both",
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await requireCategories(ctx.db, [input.category]);
        await requireCircuitCategory(ctx.db, input.circuitId ?? (await circuitOfPhase(ctx.db, input.circuitPhaseId!)), input.category);
        const [updated] = await ctx.db.batch([
          ctx.db
            .update(circuitResults)
            .set({
              playerId: input.playerId,
              circuitId: input.circuitId ?? null,
              circuitPhaseId: input.circuitPhaseId ?? null,
              category: input.category ?? null,
              place: input.place ?? null,
              points: input.points,
            })
            .where(eq(circuitResults.id, input.id))
            .returning(),
          ...syncStageResultPodium(ctx.db, input.id),
        ]);
        return requireMutationRows(updated, "Circuit result");
      }),
    delete: adminProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
          await ctx.db.delete(circuitResults).where(eq(circuitResults.id, input.id)).returning({ id: circuitResults.id }),
          "Circuit result",
        )
      ),
  }),
});

function circuitPoints(db: Context["db"], circuit: { id: number; type: string }) {
  const columns = {
    playerId: circuitResults.playerId,
    points: circuitResults.points,
    category: circuitResults.category,
  };
  const rows =
    circuit.type === "geral"
      ? db.select(columns).from(circuitResults).where(eq(circuitResults.circuitId, circuit.id))
      : db
          .select(columns)
          .from(circuitResults)
          .innerJoin(circuitPhases, eq(circuitPhases.id, circuitResults.circuitPhaseId))
          .where(eq(circuitPhases.circuitId, circuit.id));
  return rows.limit(CIRCUIT_POINTS_LIMIT) as Promise<
    { playerId: number; points: number; category: string | null }[]
  >;
}
