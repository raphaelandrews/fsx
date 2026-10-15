import { z } from "zod";
import { and, count, desc, eq } from "drizzle-orm";

import { changeLog, CHANGE_ENTITIES } from "@fsx/db/schema/change-log";
import { adminProcedure, router } from "../index";
import { page, positiveInt } from "../input-schemas";
import { paginate } from "../lib/pagination";

export const HISTORY_PER_PAGE = 30;

const parseChanges = (json: string): Record<string, [unknown, unknown]> => {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
};

export const historyRouter = router({
  list: adminProcedure
    .input(z.object({ page, entity: z.enum(CHANGE_ENTITIES).optional(), recordId: positiveInt.optional() }))
    .query(async ({ ctx, input }) => {
      const where = and(
        input.entity ? eq(changeLog.entity, input.entity) : undefined,
        input.recordId ? eq(changeLog.recordId, input.recordId) : undefined,
      );
      const [rows, totals] = await ctx.db.batch([
        ctx.db
          .select()
          .from(changeLog)
          .where(where)
          .orderBy(desc(changeLog.createdAt), desc(changeLog.id))
          .limit(HISTORY_PER_PAGE)
          .offset((input.page - 1) * HISTORY_PER_PAGE),
        ctx.db.select({ value: count() }).from(changeLog).where(where),
      ]);
      return {
        entries: rows.map((row) => ({ ...row, changes: parseChanges(row.changes) })),
        pagination: paginate({ page: input.page, perPage: HISTORY_PER_PAGE, totalItems: totals[0]?.value ?? 0 }),
      };
    }),
});
