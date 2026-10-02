import { z } from "zod";
import { eq } from "drizzle-orm";

import { linkGroups, insertLinkGroupSchema } from "@fsx/db/schema/linkGroups";
import { links, insertLinkSchema } from "@fsx/db/schema/links";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { nameText, optionalHttpUrl, positiveInt, sortOrder } from "../input-schemas";
import { isKnownLinkIcon } from "../link-icons";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

const linkTypeEnum = z.enum(["link", "regulation", "form", "results"]);

const linkIcon = z.string().max(5_000).refine(isKnownLinkIcon, "Unknown link icon");

export const linkGroupsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.linkGroups.findMany({
      columns: { id: true, label: true, eventId: true },
      // Event-owned groups are included so their links also surface on the
      // public /links page; the event name is exposed for the group label.
      with: {
        event: { columns: { name: true } },
        links: {
          limit: PUBLIC_NESTED_COLLECTION_LIMIT,
          columns: { id: true, href: true, label: true, icon: true, sortOrder: true },
          orderBy: (l, { asc }) => [asc(l.sortOrder), asc(l.id)],
        },
      },
      orderBy: (lg, { asc }) => asc(lg.id),
      limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  create: adminProcedure
    .input(insertLinkGroupSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      label: nameText,
      eventId: positiveInt.nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(linkGroups).values(input).returning()
    ),
  createLink: adminProcedure
    .input(insertLinkSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      href: optionalHttpUrl.nullable().optional(),
      label: nameText,
      icon: linkIcon,
      type: linkTypeEnum.optional(),
      sortOrder,
      linkGroupId: positiveInt,
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(links).values({ ...input, href: input.href || null }).returning()
    ),
  updateLink: adminProcedure
    .input(z.object({
      id: positiveInt,
      href: optionalHttpUrl.nullable().optional(),
      label: nameText.optional(),
      icon: linkIcon.optional(),
      type: linkTypeEnum.optional(),
      sortOrder: sortOrder.optional(),
      linkGroupId: positiveInt.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const patch = { ...input, href: input.href === undefined ? undefined : input.href || null };
      return requireMutationRows(
        await ctx.db.update(links).set(patch).where(eq(links.id, input.id)).returning(),
        "Link",
      );
    }),
  deleteLink: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(links).where(eq(links.id, input.id)).returning({ id: links.id }),
        "Link",
      )
    ),
  deleteGroup: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(links).where(eq(links.linkGroupId, input.id));
      return requireMutationRows(
        await ctx.db.delete(linkGroups).where(eq(linkGroups.id, input.id)).returning({ id: linkGroups.id }),
        "Link group",
      );
    }),
  updateGroup: adminProcedure
    .input(z.object({ id: positiveInt, label: nameText }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(linkGroups).set({ label: input.label }).where(eq(linkGroups.id, input.id)).returning(),
        "Link group",
      )
    ),
});
