import { z } from "zod";
import { eq } from "drizzle-orm";

import { circuitPhases } from "@fsx/db/schema/circuitPhases";
import { circuitPodiums } from "@fsx/db/schema/circuitPodiums";
import { circuits } from "@fsx/db/schema/circuits";
import { CIRCUIT_CATEGORIES, CIRCUIT_TYPES } from "../circuit-types";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { idInput, nameText, points, positiveInt, sortOrder } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

const circuitTypeEnum = z.enum(CIRCUIT_TYPES);

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
  category: z.enum(CIRCUIT_CATEGORIES).nullable().optional(),
  place: positiveInt.max(25).nullable().optional(),
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
      columns: { id: true, name: true, type: true },
      with: {
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
              with: {
                player: {
                  columns: { id: true, name: true, nickname: true, imageUrl: true },
                  with: {
                    club: { columns: { id: true, name: true, logoUrl: true } },
                    playersToTitles: {
                      columns: {},
                      with: { title: { columns: { shortName: true, type: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        circuitPodiums: {
          limit: PUBLIC_NESTED_COLLECTION_LIMIT,
          columns: { id: true, category: true, place: true, points: true, playerId: true },
          orderBy: (podium, { asc, desc }) => [desc(podium.points), asc(podium.id)],
          with: {
            player: {
              columns: { id: true, name: true, nickname: true, imageUrl: true },
              with: {
                club: { columns: { id: true, name: true, logoUrl: true } },
                playersToTitles: {
                  columns: {},
                  with: { title: { columns: { shortName: true, type: true } } },
                },
              },
            },
          },
        },
      },
    }), "Circuit"),
  ),
  listSimple: publicProcedure.query(({ ctx }) =>
    ctx.db.select({ id: circuits.id, name: circuits.name, type: circuits.type })
      .from(circuits).orderBy(circuits.name, circuits.id).limit(PUBLIC_COLLECTION_LIMIT),
  ),
  create: adminProcedure
    .input(z.object({ name: nameText, type: circuitTypeEnum }))
    .mutation(({ ctx, input }) => ctx.db.insert(circuits).values(input).returning()),
  update: adminProcedure
    .input(
      z.object({
        id: positiveInt,
        name: z.string().min(1).max(80),
        type: circuitTypeEnum,
      }),
    )
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db
          .update(circuits)
          .set({ name: input.name, type: input.type })
          .where(eq(circuits.id, input.id))
          .returning(),
        "Circuit",
      )
    ),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(circuits).where(eq(circuits.id, input.id)).returning({ id: circuits.id }),
        "Circuit",
      )
    ),
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
