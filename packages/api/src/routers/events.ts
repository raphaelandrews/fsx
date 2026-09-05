import { z } from "zod";
import { eq } from "drizzle-orm";

import { events, insertEventSchema } from "@fsx/db/schema/events";
import { linkGroups } from "@fsx/db/schema/linkGroups";
import { links } from "@fsx/db/schema/links";
import { adminProcedure, publicProcedure, router } from "../index";

const LINK_SVG = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const LINK_ICON_DOCUMENT = LINK_SVG(
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
);
const LINK_ICON_FORM = LINK_SVG(
  '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M8 12h8"/><path d="M8 16h5"/>',
);
const LINK_ICON_RESULTS = LINK_SVG(
  '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4"/><path d="M17 6h3a3 3 0 0 1-3 4"/>',
);
const LINK_ICON_CALENDAR = LINK_SVG(
  '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
);
const DEFAULT_LINK_ICON = LINK_SVG(
  '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
);

// Recurring event links reuse the same icon based on their label.
function iconForLinkLabel(label: string): string {
  const l = label.trim().toLowerCase();
  if (/regul/.test(l)) return LINK_ICON_DOCUMENT;
  if (/form|inscr|cadastr/.test(l)) return LINK_ICON_FORM;
  if (/result|classific/.test(l)) return LINK_ICON_RESULTS;
  if (/calend|data|agend/.test(l)) return LINK_ICON_CALENDAR;
  return DEFAULT_LINK_ICON;
}

export const eventsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.events.findMany({
      columns: { id: true, name: true, startDate: true },
      with: {
        linkGroup: {
          columns: { id: true },
          with: {
            links: {
              columns: { id: true, href: true, label: true, sortOrder: true },
              orderBy: (l, { asc }) => asc(l.sortOrder),
            },
          },
        },
      },
      orderBy: (e, { asc }) => asc(e.startDate),
    })
  ),
  create: adminProcedure
    .input(insertEventSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(events).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      startDate: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(events).set(input).where(eq(events.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.query.linkGroups.findFirst({
        where: eq(linkGroups.eventId, input.id),
      });
      if (group) {
        await ctx.db.delete(links).where(eq(links.linkGroupId, group.id));
        await ctx.db.delete(linkGroups).where(eq(linkGroups.id, group.id));
      }
      return ctx.db.delete(events).where(eq(events.id, input.id));
    }),
  // Reconcile the full set of links that belong to an event. The event owns a
  // single link_groups row; its regulation/form/results URLs live as links.
  setLinks: adminProcedure
    .input(z.object({
      eventId: z.number(),
      links: z.array(z.object({
        id: z.number().optional(),
        // Empty/null means "announced but not available yet".
        href: z.string().nullable().optional(),
        label: z.string().min(1),
        sortOrder: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const existingGroup = await ctx.db.query.linkGroups.findFirst({
        where: eq(linkGroups.eventId, input.eventId),
      });
      const group = existingGroup ??
        (await ctx.db
          .insert(linkGroups)
          .values({ label: "Links", eventId: input.eventId })
          .returning())[0];

      if (!group) throw new Error("Failed to create the event link group");

      const existing = await ctx.db.query.links.findMany({
        where: eq(links.linkGroupId, group.id),
      });
      const desiredIds = new Set<number>();
      let counter = 0;

      for (const item of input.links) {
        const sortOrder = item.sortOrder ?? ++counter;
        if (item.id) {
          desiredIds.add(item.id);
          await ctx.db
            .update(links)
            .set({ href: item.href || null, label: item.label, sortOrder })
            .where(eq(links.id, item.id));
        } else {
          const [row] = await ctx.db
            .insert(links)
            .values({
              href: item.href || null,
              label: item.label,
              icon: iconForLinkLabel(item.label),
              sortOrder,
              linkGroupId: group.id,
            })
            .returning();
          if (row) desiredIds.add(row.id);
        }
      }

      for (const existingLink of existing) {
        if (!desiredIds.has(existingLink.id)) {
          await ctx.db.delete(links).where(eq(links.id, existingLink.id));
        }
      }

      return ctx.db.query.links.findMany({
        where: eq(links.linkGroupId, group.id),
        orderBy: (l, { asc }) => asc(l.sortOrder),
      });
    }),
});
