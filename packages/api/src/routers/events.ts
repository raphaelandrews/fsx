import { z } from "zod";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { events, insertEventSchema } from "@fsx/db/schema/events";
import { linkGroups } from "@fsx/db/schema/link-groups";
import { links } from "@fsx/db/schema/links";
import { tournaments } from "@fsx/db/schema/tournaments";
import { EVENT_LINK_TYPES } from "../event-link-types";
import { iconForLinkLabel } from "../link-icons";
import { adminProcedure, publicProcedure, router } from "../index";
import type { Context } from "../context";
import { requireFound, requireMutationRows } from "../errors";
import { requireOwnedEventLink, validateEventLinkTypes } from "../services/event-links";
import { idInput, isoDate, nameText, optionalHttpUrl, positiveInt, searchText, seasonYear, sortOrder } from "../input-schemas";
import { federationToday } from "../lib/dates";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../lib/resource-bounds";

export const UPCOMING_EVENTS_LIMIT = 12;
const CALENDAR_LIMIT = 200;

const eventDetails = {
  endDate: isoDate.nullable().optional(),
  venue: searchText.nullable().optional(),
  venueUrl: optionalHttpUrl.nullable().optional().transform((value) => (value === undefined ? undefined : value || null)),
  tournamentId: positiveInt.nullable().optional(),
};

function assertValidEvent(event: { startDate: string; endDate?: string | null }) {
  if (event.endDate && event.endDate < event.startDate) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The end date cannot be before the start date" });
  }
}

async function assertTournamentExists(db: Context["db"], tournamentId: number | null | undefined) {
  if (!tournamentId) return;
  const found = await db.query.tournaments.findFirst({ where: eq(tournaments.id, tournamentId), columns: { id: true } });
  if (!found) throw new TRPCError({ code: "BAD_REQUEST", message: "Tournament not found" });
}

export const listEvents = (db: Context["db"], options: { upcoming: boolean; limit: number; from?: string; to?: string }) =>
  db.query.events.findMany({
    columns: { id: true, name: true, startDate: true, endDate: true, venue: true, venueUrl: true, tournamentId: true },
    with: {
      tournament: { columns: { name: true } },
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
    where: options.from && options.to
      ? and(lte(events.startDate, options.to), gte(sql`coalesce(${events.endDate}, ${events.startDate})`, options.from))
      : options.upcoming
        ? gte(sql`coalesce(${events.endDate}, ${events.startDate})`, federationToday())
        : undefined,
    orderBy: (e, { asc }) => [asc(e.startDate), asc(e.id)],
    limit: options.limit,
  });

export const eventsRouter = router({
  upcoming: publicProcedure.query(({ ctx }) => listEvents(ctx.db, { upcoming: true, limit: UPCOMING_EVENTS_LIMIT })),
  list: publicProcedure.query(({ ctx }) => listEvents(ctx.db, { upcoming: false, limit: PUBLIC_COLLECTION_LIMIT })),
  calendar: publicProcedure
    .input(z.object({ year: seasonYear, month: z.number().int().min(1).max(12).optional() }))
    .query(({ ctx, input }) => {
      const month = input.month ? String(input.month).padStart(2, "0") : null;
      const prefix = month ? `${input.year}-${month}` : String(input.year);
      return listEvents(ctx.db, {
        upcoming: false,
        limit: CALENDAR_LIMIT,
        from: month ? `${prefix}-01` : `${prefix}-01-01`,
        to: month ? `${prefix}-31` : `${prefix}-12-31`,
      });
    }),
  create: adminProcedure
    .input(insertEventSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      startDate: isoDate,
      ...eventDetails,
    }))
    .mutation(async ({ ctx, input }) => {
      assertValidEvent(input);
      await assertTournamentExists(ctx.db, input.tournamentId);
      return ctx.db.insert(events).values(input).returning();
    }),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
      startDate: isoDate.optional(),
      ...eventDetails,
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.startDate !== undefined || input.endDate !== undefined) {
        const current = requireFound(
          await ctx.db.query.events.findFirst({ where: eq(events.id, input.id), columns: { startDate: true, endDate: true } }),
          "Event",
        );
        assertValidEvent({
          startDate: input.startDate ?? current.startDate,
          endDate: input.endDate === undefined ? current.endDate : input.endDate,
        });
      }
      await assertTournamentExists(ctx.db, input.tournamentId);
      return requireMutationRows(
        await ctx.db.update(events).set(input).where(eq(events.id, input.id)).returning(),
        "Event",
      );
    }),
  delete: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.delete(events).where(eq(events.id, input.id)).returning({ id: events.id }),
        "Event",
      ),
    ),
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
