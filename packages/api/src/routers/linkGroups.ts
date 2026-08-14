import { z } from "zod";
import { eq } from "drizzle-orm";

import { linkGroups, insertLinkGroupSchema } from "@fsx/db/schema/linkGroups";
import { links, insertLinkSchema } from "@fsx/db/schema/links";
import { adminProcedure, publicProcedure, router } from "../index";

export const linkGroupsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.linkGroups.findMany({
      columns: { id: true, label: true },
      with: {
        links: {
          columns: { id: true, href: true, label: true, icon: true, sortOrder: true },
          orderBy: (l, { asc }) => asc(l.sortOrder),
        },
      },
      orderBy: (lg, { asc }) => asc(lg.id),
    })
  ),
  create: adminProcedure
    .input(insertLinkGroupSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(linkGroups).values(input).returning()
    ),
  createLink: adminProcedure
    .input(insertLinkSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(links).values(input).returning()
    ),
  updateLink: adminProcedure
    .input(z.object({
      id: z.number(),
      href: z.string().optional(),
      label: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
      linkGroupId: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(links).set(input).where(eq(links.id, input.id)).returning()
    ),
  deleteLink: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(links).where(eq(links.id, input.id))
    ),
  deleteGroup: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(links).where(eq(links.linkGroupId, input.id));
      return ctx.db.delete(linkGroups).where(eq(linkGroups.id, input.id));
    }),
  updateGroup: adminProcedure
    .input(z.object({ id: z.number(), label: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(linkGroups).set({ label: input.label }).where(eq(linkGroups.id, input.id)).returning()
    ),
});
