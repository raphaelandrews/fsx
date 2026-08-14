import { z } from "zod";
import { eq } from "drizzle-orm";

import { playersToRoles, insertPlayerToRoleSchema } from "@fsx/db/schema/playersToRoles";
import { adminProcedure, router } from "../index";

export const playersToRolesRouter = router({
  listByPlayer: adminProcedure
    .input(z.object({ playerId: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.playersToRoles.findMany({
        where: eq(playersToRoles.playerId, input.playerId),
        with: { role: true },
      })
    ),

  link: adminProcedure
    .input(insertPlayerToRoleSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersToRoles).values(input).returning()
    ),

  unlink: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(playersToRoles).where(eq(playersToRoles.id, input.id))
    ),
});
