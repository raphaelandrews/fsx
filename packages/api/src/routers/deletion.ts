import { z } from "zod";

import { adminProcedure, router } from "../index";
import { positiveInt } from "../input-schemas";
import { DELETE_ENTITIES, deleteImpact } from "../services/delete-impact";

export const deletionRouter = router({
  impact: adminProcedure
    .input(z.object({ entity: z.enum(DELETE_ENTITIES), id: positiveInt }))
    .query(({ ctx, input }) => deleteImpact(ctx.db, input.entity, input.id)),
});
