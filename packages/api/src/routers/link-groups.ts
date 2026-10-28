import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";

import { linkGroups, insertLinkGroupSchema } from "@fsx/db/schema/link-groups";
import { links, insertLinkSchema } from "@fsx/db/schema/links";
import type { Context } from "../context";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { idInput, nameText, optionalHttpUrl, positiveInt, sortOrder } from "../input-schemas";
import { isKnownLinkIcon } from "../link-icons";
import { listEvents, UPCOMING_EVENTS_LIMIT } from "./events";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../lib/resource-bounds";

const linkTypeEnum = z.enum(["link", "regulation", "form", "results"]);

async function requireStandaloneGroup(db: Context["db"], id: number) {
  const group = await db.query.linkGroups.findFirst({
    where: eq(linkGroups.id, id),
    columns: { id: true, eventId: true },
  });
  if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Link group not found" });
  if (group.eventId !== null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Event links are edited on the event page.",
    });
  }
}

const linkIcon = z.string().max(5_000).refine(isKnownLinkIcon, "Unknown link icon");

// The public links page shows every standalone group but only the next few events, so the page stays short.
const LINKS_PAGE_EVENTS = 3;

// Participants still look for results and photos after an event ends.
const LINKS_GRACE_DAYS = 7;

export const linkGroupsRouter = router({
  page: publicProcedure.query(async ({ ctx }) => {
    const [groups, upcoming] = await Promise.all([
      ctx.db.query.linkGroups.findMany({
        where: isNull(linkGroups.eventId),
        columns: { id: true, label: true },
        with: {
          links: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: { id: true, href: true, label: true, icon: true, sortOrder: true },
            orderBy: (l, { asc }) => [asc(l.sortOrder), asc(l.id)],
          },
        },
        orderBy: (lg, { asc }) => asc(lg.id),
        limit: PUBLIC_COLLECTION_LIMIT,
      }),
      listEvents(ctx.db, { upcoming: true, limit: UPCOMING_EVENTS_LIMIT, graceDays: LINKS_GRACE_DAYS }),
    ]);
    return {
      groups: groups.filter((group) => group.links.length > 0),
      events: upcoming.filter((event) => (event.linkGroup?.links.length ?? 0) > 0).slice(0, LINKS_PAGE_EVENTS),
    };
  }),
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
    }),
  ),
  create: adminProcedure
    .input(
      insertLinkGroupSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
        label: nameText,
        eventId: positiveInt.nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.db.insert(linkGroups).values(input).returning()),
  createLink: adminProcedure
    .input(
      insertLinkSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
        href: optionalHttpUrl.nullable().optional(),
        label: nameText,
        icon: linkIcon,
        type: linkTypeEnum.optional(),
        sortOrder,
        linkGroupId: positiveInt,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireStandaloneGroup(ctx.db, input.linkGroupId);
      return ctx.db
        .insert(links)
        .values({ ...input, href: input.href || null })
        .returning();
    }),
  updateLink: adminProcedure
    .input(
      z.object({
        id: positiveInt,
        href: optionalHttpUrl.nullable().optional(),
        label: nameText.optional(),
        icon: linkIcon.optional(),
        type: linkTypeEnum.optional(),
        sortOrder: sortOrder.optional(),
        linkGroupId: positiveInt.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const current = requireFound(
        await ctx.db.query.links.findFirst({
          where: eq(links.id, input.id),
          columns: { linkGroupId: true },
        }),
        "Link",
      );
      await requireStandaloneGroup(ctx.db, current.linkGroupId);
      if (input.linkGroupId !== undefined) await requireStandaloneGroup(ctx.db, input.linkGroupId);
      const patch = { ...input, href: input.href === undefined ? undefined : input.href || null };
      return requireMutationRows(
        await ctx.db.update(links).set(patch).where(eq(links.id, input.id)).returning(),
        "Link",
      );
    }),
  deleteLink: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(links).where(eq(links.id, input.id)).returning({ id: links.id }),
        "Link",
      ),
    ),
  deleteGroup: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db
          .delete(linkGroups)
          .where(and(eq(linkGroups.id, input.id), isNull(linkGroups.eventId)))
          .returning({ id: linkGroups.id }),
        "Link group",
      ),
    ),
  updateGroup: adminProcedure
    .input(z.object({ id: positiveInt, label: nameText }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db
          .update(linkGroups)
          .set({ label: input.label })
          .where(and(eq(linkGroups.id, input.id), isNull(linkGroups.eventId)))
          .returning(),
        "Link group",
      ),
    ),
});
