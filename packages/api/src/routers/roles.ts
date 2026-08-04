import { z } from "zod";
import { eq, asc } from "drizzle-orm";

import { roles, insertRoleSchema } from "@fsx/db/schema/roles";
import { protectedProcedure, publicProcedure, router } from "../index";

export const rolesRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(roles).orderBy(asc(roles.role))
  ),
  listWithPlayers: publicProcedure.query(({ ctx }) =>
    ctx.db.query.roles.findMany({
      with: {
        playersToRoles: {
          fields: ["playerId", "roleId"],
          with: {
            player: { columns: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    })
  ),
  create: protectedProcedure
    .input(insertRoleSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(roles).values(input).returning()
    ),
  update: protectedProcedure
    .input(z.object({ id: z.number(), role: z.string().max(80).optional(), shortRole: z.string().max(4).optional(), type: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(roles).set(input).where(eq(roles.id, input.id)).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(roles).where(eq(roles.id, input.id))
    ),
});
