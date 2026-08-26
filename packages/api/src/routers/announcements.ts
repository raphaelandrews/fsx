import { z } from "zod";
import { eq, desc, count } from "drizzle-orm";

import { announcements, insertAnnouncementSchema } from "@fsx/db/schema/announcements";
import { adminProcedure, publicProcedure, router } from "../index";

export const announcementsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: announcements.id,
        year: announcements.year,
        number: announcements.number,
        content: announcements.content,
      })
      .from(announcements)
      .orderBy(desc(announcements.year), desc(announcements.number)),
  ),
  byId: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
    ctx.db.query.announcements.findFirst({
      columns: { id: true, year: true, number: true, content: true },
      where: eq(announcements.id, input.id),
    }),
  ),
  byPage: publicProcedure
    .input(z.object({ page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const validPage = Math.max(1, input.page);
      const perPage = 12;
      const data = await ctx.db.query.announcements.findMany({
        columns: { id: true, year: true, number: true, content: true },
        orderBy: [desc(announcements.year), desc(announcements.number)],
        limit: perPage,
        offset: (validPage - 1) * perPage,
      });
      const countResult = await ctx.db.select({ value: count() }).from(announcements);
      const totalItems = countResult[0]?.value ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
      return {
        announcements: data,
        pagination: {
          currentPage: validPage,
          totalPages,
          totalItems,
          itemsPerPage: perPage,
          hasNextPage: validPage < totalPages,
          hasPreviousPage: validPage > 1,
        },
      };
    }),
  fresh: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: announcements.id,
        year: announcements.year,
        number: announcements.number,
        content: announcements.content,
      })
      .from(announcements)
      .orderBy(desc(announcements.year), desc(announcements.number))
      .limit(8),
  ),
  create: adminProcedure
    .input(insertAnnouncementSchema.omit({ id: true }))
    .mutation(({ ctx, input }) => ctx.db.insert(announcements).values(input).returning()),
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        year: z.number().optional(),
        number: z.number().optional(),
        content: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.update(announcements).set(input).where(eq(announcements.id, input.id)).returning(),
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(announcements).where(eq(announcements.id, input.id)),
    ),
});
