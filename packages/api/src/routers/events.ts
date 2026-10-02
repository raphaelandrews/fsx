import { z } from "zod";
import { and, asc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { events, insertEventSchema } from "@fsx/db/schema/events";
import { linkGroups } from "@fsx/db/schema/linkGroups";
import { links } from "@fsx/db/schema/links";
import { EVENT_LINK_TYPES } from "../event-link-types";
import { iconForLinkLabel } from "../link-icons";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireMutationRows } from "../errors";
import { requireOwnedEventLink, validateEventLinkTypes } from "./event-links";
import { isoDate, nameText, optionalHttpUrl, positiveInt, sortOrder } from "../input-schemas";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";

export const eventsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.events.findMany({
      columns: { id: true, name: true, startDate: true },
      with: {
        linkGroup: {
          columns: { id: true },
          with: {
            links: {
              limit: PUBLIC_NESTED_COLLECTION_LIMIT,
              columns: { id: true, href: true, label: true, icon: true, type: true, sortOrder: true },
              orderBy: (l, { asc }) => [asc(l.sortOrder), asc(l.id)],
            },
          },
        },
      },
      orderBy: (e, { asc }) => [asc(e.startDate), asc(e.id)],
      limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  create: adminProcedure
    .input(insertEventSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      startDate: isoDate,
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(events).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
      startDate: isoDate.optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(events).set(input).where(eq(events.id, input.id)).returning(),
        "Event",
      )
    ),
  delete: adminProcedure
    .input(z.object({ id: positiveInt }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.linkGroups.findFirst({
        where: eq(linkGroups.eventId, input.id),
      });
      if (group) {
        await ctx.db.delete(links).where(eq(links.linkGroupId, group.id));
        await ctx.db.delete(linkGroups).where(eq(linkGroups.id, group.id));
      }
      return requireMutationRows(
        await ctx.db.delete(events).where(eq(events.id, input.id)).returning({ id: events.id }),
        "Event",
      );
    }),
  // Reconcile the full set of links that belong to an event. The event owns a
  // single link_groups row; its regulation/form/results URLs live as links.
  setLinks: adminProcedure
    .input(z.object({
      eventId: positiveInt,
      links: z.array(z.object({
        id: positiveInt.optional(),
        href: optionalHttpUrl.nullable().optional(),
        type: z.enum(["regulation", "form", "results"]),
        sortOrder: sortOrder.optional(),
      })).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      validateEventLinkTypes(input.links.map((item) => item.type));

      // D1 rejects BEGIN, so interactive transactions fail at runtime. Ownership
      // is checked on the reads below; every write then runs in one atomic batch.
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true },
      });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const existingGroup = await ctx.db.query.linkGroups.findFirst({
        where: eq(linkGroups.eventId, input.eventId),
        columns: { id: true },
      });
      const existing = existingGroup
        ? await ctx.db.query.links.findMany({
            where: eq(links.linkGroupId, existingGroup.id),
            columns: { id: true },
          })
        : [];
      const existingIds = new Set(existing.map((link) => link.id));
      for (const item of input.links) {
        if (item.id !== undefined) requireOwnedEventLink(existingIds, item.id);
      }

      const groupId = sql<number>`(SELECT ${linkGroups.id} FROM ${linkGroups} WHERE ${linkGroups.eventId} = ${input.eventId})`;
      const keptIds = new Set(input.links.flatMap((item) => (item.id === undefined ? [] : [item.id])));
      let counter = 0;

      const writes = input.links.map((item) => {
        const sortOrder = item.sortOrder ?? ++counter;
        const label = EVENT_LINK_TYPES.find((t) => t.value === item.type)!.label;
        const values = {
          href: item.href || null,
          label,
          icon: iconForLinkLabel(label),
          type: item.type,
          sortOrder,
        };
        return item.id === undefined
          ? ctx.db.insert(links).values({ ...values, linkGroupId: groupId })
          : ctx.db
              .update(links)
              .set(values)
              .where(and(eq(links.id, item.id), eq(links.linkGroupId, groupId)));
      });
      const deletes = [...existingIds]
        .filter((id) => !keptIds.has(id))
        .map((id) => ctx.db.delete(links).where(and(eq(links.id, id), eq(links.linkGroupId, groupId))));

      const results = await ctx.db.batch([
        ctx.db
          .insert(linkGroups)
          .values({ label: "Links", eventId: input.eventId })
          .onConflictDoNothing({ target: linkGroups.eventId }),
        ...writes,
        ...deletes,
        ctx.db
          .select()
          .from(links)
          .where(eq(links.linkGroupId, groupId))
          .orderBy(asc(links.sortOrder), asc(links.id)),
      ]);
      return results[results.length - 1] as (typeof links.$inferSelect)[];
    }),
});
