import { z } from "zod";
import { eq } from "drizzle-orm";

import { circuits, insertCircuitSchema } from "@fsx/db/schema/circuits";
import { adminProcedure, publicProcedure, router } from "../index";

export const circuitsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.circuits.findMany({
      columns: { name: true, type: true },
      with: {
        circuitPhases: {
          columns: { id: true, sortOrder: true },
          with: {
            tournament: { columns: { name: true } },
            circuitPodiums: {
              columns: { category: true, place: true, points: true },
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
      },
    })
  ),
  listSimple: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(circuits).orderBy(circuits.name)
  ),
  create: adminProcedure
    .input(insertCircuitSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(circuits).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(80), type: z.enum(["default", "categories", "school"]) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(circuits).set({ name: input.name, type: input.type }).where(eq(circuits.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(circuits).where(eq(circuits.id, input.id))
    ),
});
