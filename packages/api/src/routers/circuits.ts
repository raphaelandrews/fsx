import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { circuitFinalPodiums } from "@fsx/db/schema/circuitFinalPodiums";
import { circuitPhases } from "@fsx/db/schema/circuitPhases";
import { circuitPodiums } from "@fsx/db/schema/circuitPodiums";
import { circuits } from "@fsx/db/schema/circuits";
import { COMPETITION_CATEGORIES, COMPETITION_TIERS, CIRCUIT_TYPES, type CircuitType } from "../circuit-types";
import { circuitFinalPodiums as rankFinalPodiums } from "../circuit-standings";
import type { Context } from "../context";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { idInput, isoDate, nameText, points, positiveInt, seasonYear, sortOrder } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

const circuitTypeEnum = z.enum(CIRCUIT_TYPES);
const categoryEnum = z.enum(COMPETITION_CATEGORIES);

// A season's points rows across all stages; far above any real circuit.
const CIRCUIT_POINTS_LIMIT = 20_000;

const circuitInput = z.object({
  name: nameText,
  type: circuitTypeEnum,
  year: seasonYear,
  tier: z.enum(COMPETITION_TIERS).default("B"),
  championshipId: positiveInt.nullable().optional(),
});

const finalPodiumInput = z.object({
  playerId: positiveInt,
  category: categoryEnum.nullable().optional(),
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
  category: categoryEnum.nullable().optional(),
  place: positiveInt.max(1000).nullable().optional(),
  points,
});

const hasSinglePodiumTarget = (value: {
  circuitId?: number | null;
  circuitPhaseId?: number | null;
}) => (value.circuitId != null) !== (value.circuitPhaseId != null);

export const circuitsRouter = router({
  byId: publicProcedure.input(idInput).query(async ({ ctx, input }) =>
    requireFound(await ctx.db.query.circuits.findFirst({
      where: eq(circuits.id, input.id),
      columns: { id: true, name: true, type: true, year: true, tier: true, championshipId: true, finishedAt: true },
      with: {
        championship: { columns: { id: true, name: true } },
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
            circuitPodiums: {
              limit: PUBLIC_NESTED_COLLECTION_LIMIT,
              columns: { id: true, category: true, place: true, points: true, playerId: true },
              orderBy: (podium, { asc, desc }) => [desc(podium.points), asc(podium.id)],
              with: { player: playerColumns },
            },
          },
        },
        circuitPodiums: {
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
  create: adminProcedure
    .input(circuitInput)
    .mutation(({ ctx, input }) =>
      ctx.db.insert(circuits).values({ ...input, championshipId: input.championshipId ?? null }).returning(),
    ),
  update: adminProcedure
    .input(circuitInput.extend({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db
          .update(circuits)
          .set({
            name: input.name,
            type: input.type,
            year: input.year,
            tier: input.tier,
            championshipId: input.championshipId ?? null,
          })
          .where(eq(circuits.id, input.id))
          .returning(),
        "Circuit",
      )
    ),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const finished = await ctx.db.query.circuitFinalPodiums.findFirst({
        where: eq(circuitFinalPodiums.circuitId, input.id),
        columns: { id: true },
      });
      if (finished) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This circuit has final podiums. Reopen it before deleting it.",
        });
      }
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
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
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
        )
      ),
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
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
          await ctx.db
            .update(circuitPhases)
            .set({
              tournamentId: input.tournamentId,
              clubId: input.clubId ?? null,
              sortOrder: input.sortOrder,
            })
            .where(eq(circuitPhases.id, input.id))
            .returning(),
          "Circuit phase",
        )
      ),
    delete: adminProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
          await ctx.db.delete(circuitPhases).where(eq(circuitPhases.id, input.id)).returning({ id: circuitPhases.id }),
          "Circuit phase",
        )
      ),
  }),
  podiums: router({
    create: adminProcedure
      .input(
        podiumInput.refine(hasSinglePodiumTarget, {
          message: "Podium must target either a circuit or a phase, not both",
        }),
      )
      .mutation(({ ctx, input }) =>
        ctx.db
          .insert(circuitPodiums)
          .values({
            playerId: input.playerId,
            circuitId: input.circuitId ?? null,
            circuitPhaseId: input.circuitPhaseId ?? null,
            category: input.category ?? null,
            place: input.place ?? null,
            points: input.points,
          })
          .returning(),
      ),
    update: adminProcedure
      .input(
        podiumInput.extend({ id: positiveInt }).refine(hasSinglePodiumTarget, {
          message: "Podium must target either a circuit or a phase, not both",
        }),
      )
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
          await ctx.db
            .update(circuitPodiums)
            .set({
              playerId: input.playerId,
              circuitId: input.circuitId ?? null,
              circuitPhaseId: input.circuitPhaseId ?? null,
              category: input.category ?? null,
              place: input.place ?? null,
              points: input.points,
            })
            .where(eq(circuitPodiums.id, input.id))
            .returning(),
          "Circuit podium",
        )
      ),
    delete: adminProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) =>
        requireMutationRows(
          await ctx.db.delete(circuitPodiums).where(eq(circuitPodiums.id, input.id)).returning({ id: circuitPodiums.id }),
          "Circuit podium",
        )
      ),
  }),
});

function circuitPoints(db: Context["db"], circuit: { id: number; type: string }) {
  const columns = {
    playerId: circuitPodiums.playerId,
    points: circuitPodiums.points,
    category: circuitPodiums.category,
  };
  const rows =
    circuit.type === "geral"
      ? db.select(columns).from(circuitPodiums).where(eq(circuitPodiums.circuitId, circuit.id))
      : db
          .select(columns)
          .from(circuitPodiums)
          .innerJoin(circuitPhases, eq(circuitPhases.id, circuitPodiums.circuitPhaseId))
          .where(eq(circuitPhases.circuitId, circuit.id));
  return rows.limit(CIRCUIT_POINTS_LIMIT) as Promise<
    { playerId: number; points: number; category: (typeof COMPETITION_CATEGORIES)[number] | null }[]
  >;
}
