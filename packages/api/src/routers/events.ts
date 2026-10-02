import { z } from "zod";
import { and, eq } from "drizzle-orm";
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
              orderBy: (l, { asc }) => asc(l.sortOrder),
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

      return ctx.db.transaction(async (tx) => {
        const event = await tx.query.events.findFirst({
          where: eq(events.id, input.eventId),
          columns: { id: true },
        });
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        const existingGroup = await tx.query.linkGroups.findFirst({
          where: eq(linkGroups.eventId, input.eventId),
        });
        const group = existingGroup ??
          (await tx
            .insert(linkGroups)
            .values({ label: "Links", eventId: input.eventId })
            .returning())[0];

        if (!group) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create event links" });
        }

        const existing = await tx.query.links.findMany({
          where: eq(links.linkGroupId, group.id),
        });
        const existingIds = new Set(existing.map((link) => link.id));
        const desiredIds = new Set<number>();
        let counter = 0;

        for (const item of input.links) {
          const sortOrder = item.sortOrder ?? ++counter;
          const meta = EVENT_LINK_TYPES.find((t) => t.value === item.type);
          if (!meta) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event link type" });
          }
          const label = meta.label;
          const icon = iconForLinkLabel(label);
          if (item.id !== undefined) {
            requireOwnedEventLink(existingIds, item.id);
            desiredIds.add(item.id);
            await tx
              .update(links)
              .set({ href: item.href || null, label, icon, type: item.type, sortOrder })
              .where(and(eq(links.id, item.id), eq(links.linkGroupId, group.id)));
          } else {
            const [row] = await tx
              .insert(links)
              .values({
                href: item.href || null,
                label,
                icon,
                type: item.type,
                sortOrder,
                linkGroupId: group.id,
              })
              .returning();
            if (row) desiredIds.add(row.id);
          }
        }

        for (const existingLink of existing) {
          if (!desiredIds.has(existingLink.id)) {
            await tx
              .delete(links)
              .where(and(eq(links.id, existingLink.id), eq(links.linkGroupId, group.id)));
          }
        }

        return tx.query.links.findMany({
          where: eq(links.linkGroupId, group.id),
          orderBy: (l, { asc }) => asc(l.sortOrder),
        });
      });
    }),
});
