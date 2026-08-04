import { z } from "zod";
import { eq } from "drizzle-orm";

import { linkGroups, insertLinkGroupSchema } from "@fsx/db/schema/linkGroups";
import { links, insertLinkSchema } from "@fsx/db/schema/links";
import { protectedProcedure, publicProcedure, router } from "../index";

export const linkGroupsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.linkGroups.findMany({
      columns: { id: true, label: true },
      with: {
        links: {
          columns: { id: true, href: true, label: true, icon: true, order: true },
          orderBy: (l, { asc }) => asc(l.order),
        },
      },
      orderBy: (lg, { asc }) => asc(lg.id),
    })
  ),
  create: protectedProcedure
    .input(insertLinkGroupSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(linkGroups).values(input).returning()
    ),
  createLink: protectedProcedure
    .input(insertLinkSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(links).values(input).returning()
    ),
  updateLink: protectedProcedure
    .input(z.object({
      id: z.number(),
      href: z.string().optional(),
      label: z.string().optional(),
      icon: z.string().optional(),
      order: z.number().optional(),
      linkGroupId: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(links).set(input).where(eq(links.id, input.id)).returning()
    ),
  deleteLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(links).where(eq(links.id, input.id))
    ),
  deleteGroup: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(links).where(eq(links.linkGroupId, input.id));
      return ctx.db.delete(linkGroups).where(eq(linkGroups.id, input.id));
    }),
});
