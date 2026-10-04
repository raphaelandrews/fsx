import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, asc, and, inArray, gte, lte, or, sql, count, exists } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { players as playersTable, insertPlayerSchema } from "@fsx/db/schema/players";
import { clubs } from "@fsx/db/schema/clubs";
import { locations } from "@fsx/db/schema/locations";
import { titles } from "@fsx/db/schema/titles";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { normalizeName } from "@fsx/db/normalize";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { AGE_GROUPS, getBirthDateRange } from "../age-groups";
import { contentText, filterArray, idInput, imageUrl, isoDate, limit, nameText, page, positiveInt, rating, searchText, seasonYear } from "../input-schemas";
import { escapeLike, like } from "../sql-like";
import { PUBLIC_NESTED_COLLECTION_LIMIT } from "../resource-bounds";
import { loadPlayerCircuits } from "../gamification/circuits";
import { loadPlayerCareer, loadPlayerStats } from "../gamification/load";
import { playerSeason } from "../gamification/season";
import { loadPlayerRanking, movementsFor } from "../gamification/ranking";

export const playersRouter = router({
  page: adminProcedure
    .input(z.object({
      page,
      limit,
      name: searchText.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const limit = input.limit;
      const offset = (input.page - 1) * limit;
      const where = input.name
        ? like(playersTable.normalizedName, `%${escapeLike(normalizeName(input.name))}%`)
        : undefined;

      const countResult = await ctx.db.select({ value: count() }).from(playersTable).where(where);
      const totalItems = countResult[0]?.value ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));

      const players = await ctx.db.query.players.findMany({
        columns: { id: true, name: true, nickname: true, blitz: true, rapid: true, classic: true, imageUrl: true },
        with: {
          club: { columns: { name: true } },
          location: { columns: { name: true } },
        },
        where,
         orderBy: (p, { asc }) => [asc(p.name), asc(p.id)],
        limit,
        offset,
      });

      return {
        players,
        pagination: {
          currentPage: input.page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: input.page < totalPages,
          hasPreviousPage: input.page > 1,
        },
      };
    }),

  byId: publicProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => {
      const player = requireFound(await ctx.db.query.players.findFirst({
        where: eq(playersTable.id, input.id),
        columns: {
          id: true,
          name: true,
          nickname: true,
          blitz: true,
          rapid: true,
          classic: true,
          active: true,
          imageUrl: true,
          cbxId: true,
          fideId: true,
          verified: true,
        },
        with: {
          club: { columns: { id: true, name: true, logoUrl: true } },
          location: { columns: { name: true, flagUrl: true } },
          defendingChampions: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: {},
            with: { championship: { columns: { name: true } } },
          },
          // Newest results in chain (id) order, so the cap drops the oldest.
          playersToTournaments: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            orderBy: (history, { desc }) => [desc(history.id)],
            columns: { oldRating: true, variation: true },
            with: { tournament: { columns: { name: true, ratingType: true } } },
          },
          playersToRoles: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: {},
            with: { role: { columns: { name: true, shortName: true, type: true } } },
          },
          tournamentPodiums: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: { place: true, category: true },
            with: {
              tournament: {
                columns: { name: true, date: true, championshipId: true },
                with: { championship: { columns: { name: true } } },
              },
            },
          },
          playersToTitles: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: {},
            with: { title: { columns: { name: true, shortName: true, type: true, tier: true } } },
          },
        },
      }), "Player");
      return { ...player, playersToTournaments: player.playersToTournaments.reverse() };
    }),

  stats: publicProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => requireFound(await loadPlayerStats(ctx.db, input.id), "Player")),

  season: publicProcedure
    .input(z.object({ id: positiveInt, year: seasonYear }))
    .query(async ({ ctx, input }) => {
      const career = requireFound(await loadPlayerCareer(ctx.db, input.id), "Player");
      const season = playerSeason(career.input, input.year);
      if (season.tournamentsPlayed === 0 && season.podiums.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No activity recorded for this player in that year" });
      }
      const { id, name, nickname } = career.player;
      return { player: { id, name, nickname }, tournaments: career.tournaments, ...season };
    }),

  ranking: publicProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => requireFound(await loadPlayerRanking(ctx.db, input.id), "Player")),

  circuitSeasons: publicProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => requireFound(await loadPlayerCircuits(ctx.db, input.id), "Player")),

  search: publicProcedure
    .input(z.object({ query: searchText }))
    .query(({ ctx, input }) => {
      const normalizedQuery = normalizeName(input.query);
      const words = normalizedQuery.split(/\s+/).filter(Boolean);

      if (words.length === 0) {
        // Default suggestion list for the command menu: top active players by
        // rapid rating. `players_rapid_idx` drives the ORDER BY + LIMIT.
        return ctx.db
          .select({ id: playersTable.id, name: playersTable.name })
          .from(playersTable)
          .where(eq(playersTable.active, true))
          .orderBy(desc(playersTable.rapid), asc(playersTable.id))
          .limit(10);
      }

      const wordConditions = words.map(
        (word) => like(playersTable.normalizedName, `%${escapeLike(word)}%`)
      );

      const whereClause = sql.join(wordConditions, sql` AND `);

      const relevanceScore = sql<number>`
        CASE
          WHEN ${playersTable.normalizedName} = ${normalizedQuery} THEN 4
          WHEN ${like(playersTable.normalizedName, `${escapeLike(words[0] ?? "")}%`)} THEN 3
          WHEN ${like(playersTable.normalizedName, `%${escapeLike(normalizedQuery)}%`)} THEN 2
          ELSE 1
        END
      `;

      return ctx.db
        .select({ id: playersTable.id, name: playersTable.name })
        .from(playersTable)
        .where(whereClause)
        .orderBy(desc(relevanceScore), desc(playersTable.rapid), sql`LENGTH(${playersTable.name})`, asc(playersTable.id))
        .limit(10);
    }),

  forEdit: adminProcedure
    .input(idInput)
    .query(async ({ ctx, input }) =>
      requireFound(await ctx.db.query.players.findFirst({
        where: eq(playersTable.id, input.id),
        columns: {
          id: true,
          name: true,
          nickname: true,
          active: true,
          imageUrl: true,
          cbxId: true,
          fideId: true,
          verified: true,
          birthDate: true,
          sex: true,
          clubId: true,
          locationId: true,
          blitz: true,
          rapid: true,
          classic: true,
          description: true,
        },
      }), "Player")
    ),

  create: adminProcedure
    .input(insertPlayerSchema.omit({ id: true, normalizedName: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      nickname: z.string().trim().max(160).nullable().optional(),
      blitz: rating,
      rapid: rating,
      classic: rating,
      imageUrl: imageUrl.nullable().optional(),
      cbxId: positiveInt.nullable().optional(),
      fideId: positiveInt.nullable().optional(),
      birthDate: isoDate.nullable().optional(),
      sex: z.enum(["male", "female"]),
      clubId: positiveInt.nullable().optional(),
      locationId: positiveInt.nullable().optional(),
      description: contentText.nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db
        .insert(playersTable)
        .values({ ...input, normalizedName: normalizeName(input.name) })
        .returning()
    ),

  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
       nickname: z.string().trim().max(160).nullable().optional(),
      blitz: rating.optional(),
      rapid: rating.optional(),
      classic: rating.optional(),
      active: z.boolean().optional(),
       imageUrl: imageUrl.nullable().optional(),
      cbxId: positiveInt.nullable().optional(),
      fideId: positiveInt.nullable().optional(),
      verified: z.boolean().optional(),
       birthDate: isoDate.nullable().optional(),
      sex: z.enum(["male", "female"]).optional(),
      clubId: positiveInt.nullable().optional(),
      locationId: positiveInt.nullable().optional(),
       description: contentText.nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return requireMutationRows(
        await ctx.db
          .update(playersTable)
          .set({
            ...rest,
            ...(rest.name !== undefined ? { normalizedName: normalizeName(rest.name) } : {}),
          })
          .where(eq(playersTable.id, id))
          .returning(),
        "Player",
      );
    }),

  withFilters: publicProcedure
    .input(z.object({
      page,
      limit,
      sex: z.enum(["male", "female"]).optional(),
      titles: filterArray.default([]),
      clubs: filterArray.default([]),
      groups: z.array(z.enum(AGE_GROUPS)).max(AGE_GROUPS.length).default([]),
      locations: filterArray.default([]),
      sortBy: z.enum(["rapid", "blitz", "classic"]).default("rapid"),
      name: searchText.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20, sex, titles: titleFilters = [], clubs: clubFilters = [], groups: groupFilters = [], locations: locationFilters = [], sortBy = "rapid", name } = input;

      const whereConditions: SQL[] = [eq(playersTable.active, true)];

      if (name) {
        whereConditions.push(
          like(playersTable.normalizedName, `%${escapeLike(normalizeName(name))}%`)
        );
      }
      if (sex) {
        whereConditions.push(eq(playersTable.sex, sex));
      }
      // Use EXISTS instead of LEFT JOINs for the many-side filters so the
      // COUNT/ORDER BY operate on the players table alone (no row
      // multiplication) and can use the rating index.
      if (titleFilters.length) {
        whereConditions.push(
          exists(
            ctx.db
              .select()
              .from(playersToTitles)
              .innerJoin(titles, eq(playersToTitles.titleId, titles.id))
              .where(and(eq(playersToTitles.playerId, playersTable.id), inArray(titles.shortName, titleFilters)))
          )
        );
      }
      if (clubFilters.length) {
        whereConditions.push(
          exists(
            ctx.db
              .select()
              .from(clubs)
              .where(and(eq(clubs.id, playersTable.clubId), inArray(clubs.name, clubFilters)))
          )
        );
      }
      if (groupFilters.length) {
        const year = new Date().getUTCFullYear();
        const groupConditions = groupFilters.map((group) => {
          const [from, to] = getBirthDateRange(group, year);
          return and(gte(playersTable.birthDate, from), lte(playersTable.birthDate, to));
        });
        const condition = groupConditions.length === 1 ? groupConditions[0] : or(...groupConditions);
        if (condition) whereConditions.push(condition);
      }
      if (locationFilters.length) {
        whereConditions.push(
          exists(
            ctx.db
              .select()
              .from(locations)
              .where(and(eq(locations.id, playersTable.locationId), inArray(locations.name, locationFilters)))
          )
        );
      }

      const where = and(...whereConditions);

      const countResult = await ctx.db
        .select({ value: count() })
        .from(playersTable)
        .where(where);
      const totalItems = countResult[0]?.value ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const offset = (page - 1) * limit;

      const sortColumn = playersTable[sortBy];

      // 1) Page of matching player ids ordered by rating; the rating index
      //    drives ORDER BY + LIMIT/OFFSET without a full table sort or scan.
      const pageIds = await ctx.db
        .select({ id: playersTable.id })
        .from(playersTable)
        .where(where)
        .orderBy(desc(sortColumn), asc(playersTable.id))
        .limit(limit)
        .offset(offset);

      const pagination = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };

      if (pageIds.length === 0) {
        return { players: [], pagination };
      }

      const ids = pageIds.map((row) => row.id);

      // 2) Load the page's players + relations in one relational query. Drizzle
      //    issues a separate query per relation keyed on the page ids, so a
      //    player with several titles/championships no longer multiplies rows
      //    (which previously forced a full players scan + JS de-duplication).
      const [rows, movements] = await Promise.all([ctx.db.query.players.findMany({
        columns: {
          id: true,
          name: true,
          nickname: true,
          classic: true,
          rapid: true,
          blitz: true,
          imageUrl: true,
        },
        where: inArray(playersTable.id, ids),
        with: {
          club: { columns: { id: true, name: true, logoUrl: true } },
          location: { columns: { name: true, flagUrl: true } },
          defendingChampions: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: {},
            with: { championship: { columns: { name: true } } },
          },
          playersToTitles: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: {},
            with: { title: { columns: { type: true, name: true, shortName: true } } },
          },
        },
      }), movementsFor(ctx.db, sortBy, ids)]);

      // Relational loading doesn't preserve the id order; restore it.
      const byId = new Map(rows.map((player) => [player.id, player]));
      const players = ids
        .map((id) => byId.get(id))
        .filter((player): player is NonNullable<typeof player> => player !== undefined)
        .map((player) => ({ ...player, movement: movements.get(player.id) ?? null }));

      return { players, pagination };
    }),
});
