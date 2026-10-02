import { z } from "zod";
import { eq, desc, count } from "drizzle-orm";

import { announcements, insertAnnouncementSchema } from "@fsx/db/schema/announcements";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { contentText, idInput, page, positiveInt } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT } from "../resource-bounds";

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
      .orderBy(desc(announcements.year), desc(announcements.number))
      .limit(PUBLIC_COLLECTION_LIMIT),
  ),
  byId: publicProcedure.input(idInput).query(({ ctx, input }) =>
    ctx.db.query.announcements.findFirst({
      columns: { id: true, year: true, number: true, content: true },
      where: eq(announcements.id, input.id),
    }),
  ),
  byPage: publicProcedure
    .input(z.object({ page }))
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
    .input(insertAnnouncementSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      year: z.number().int().min(1900).max(2200),
      number: positiveInt.max(100_000),
      content: contentText,
    }))
    .mutation(({ ctx, input }) => ctx.db.insert(announcements).values(input).returning()),
  update: adminProcedure
    .input(
      z.object({
        id: positiveInt,
        year: z.number().int().min(1900).max(2200).optional(),
        number: positiveInt.max(100_000).optional(),
        content: contentText.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(announcements).set(input).where(eq(announcements.id, input.id)).returning(),
        "Announcement",
      )
    ),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(announcements).where(eq(announcements.id, input.id)).returning({ id: announcements.id }),
        "Announcement",
      )
    ),
});
