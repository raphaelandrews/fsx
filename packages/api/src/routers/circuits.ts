import { z } from "zod";
import { eq } from "drizzle-orm";

import { circuitPhases } from "@fsx/db/schema/circuitPhases";
import { circuitPodiums } from "@fsx/db/schema/circuitPodiums";
import { circuits } from "@fsx/db/schema/circuits";
import { CIRCUIT_TYPES } from "../circuit-types";
import { adminProcedure, publicProcedure, router } from "../index";

const circuitTypeEnum = z.enum(CIRCUIT_TYPES);

const phaseInput = z.object({
  circuitId: z.number(),
  tournamentId: z.number(),
  clubId: z.number().nullable().optional(),
  sortOrder: z.number().int(),
});

const podiumInput = z.object({
  playerId: z.number(),
  circuitId: z.number().nullable().optional(),
  circuitPhaseId: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  place: z.number().int().nullable().optional(),
  points: z.number(),
});

const hasSinglePodiumTarget = (value: {
  circuitId?: number | null;
  circuitPhaseId?: number | null;
}) => (value.circuitId != null) !== (value.circuitPhaseId != null);

export const circuitsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.circuits.findMany({
      columns: { id: true, name: true, type: true },
      with: {
        circuitPhases: {
          columns: { id: true, sortOrder: true, tournamentId: true, clubId: true },
          with: {
            tournament: { columns: { id: true, name: true } },
            club: { columns: { id: true, name: true } },
            circuitPodiums: {
              columns: { id: true, category: true, place: true, points: true, playerId: true },
              orderBy: (podiums, { desc }) => [desc(podiums.points)],
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
          columns: { id: true, category: true, place: true, points: true, playerId: true },
          orderBy: (podiums, { desc }) => [desc(podiums.points)],
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
    }),
  ),
  listSimple: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(circuits).orderBy(circuits.name),
  ),
  create: adminProcedure
    .input(z.object({ name: z.string().min(1).max(80), type: circuitTypeEnum }))
    .mutation(({ ctx, input }) => ctx.db.insert(circuits).values(input).returning()),
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(80),
        type: circuitTypeEnum,
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db
        .update(circuits)
        .set({ name: input.name, type: input.type })
        .where(eq(circuits.id, input.id))
        .returning(),
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => ctx.db.delete(circuits).where(eq(circuits.id, input.id))),
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
          id: z.number(),
          tournamentId: z.number(),
          clubId: z.number().nullable().optional(),
          sortOrder: z.number().int(),
        }),
      )
      .mutation(({ ctx, input }) =>
        ctx.db
          .update(circuitPhases)
          .set({
            tournamentId: input.tournamentId,
            clubId: input.clubId ?? null,
            sortOrder: input.sortOrder,
          })
          .where(eq(circuitPhases.id, input.id))
          .returning(),
      ),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        ctx.db.delete(circuitPhases).where(eq(circuitPhases.id, input.id)),
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
        podiumInput.extend({ id: z.number() }).refine(hasSinglePodiumTarget, {
          message: "Podium must target either a circuit or a phase, not both",
        }),
      )
      .mutation(({ ctx, input }) =>
        ctx.db
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
      ),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        ctx.db.delete(circuitPodiums).where(eq(circuitPodiums.id, input.id)),
      ),
  }),
});
