import { z } from "zod";
import { eq, desc, and, inArray, gte, lte, or, sql, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { players as playersTable, insertPlayerSchema } from "@fsx/db/schema/players";
import { clubs } from "@fsx/db/schema/clubs";
import { locations } from "@fsx/db/schema/locations";
import { titles } from "@fsx/db/schema/titles";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { defendingChampions } from "@fsx/db/schema/defendingChampions";
import { championships } from "@fsx/db/schema/championships";
import { adminProcedure, publicProcedure, router } from "../index";
import type { Context } from "../context";

const ACCENT_MAP =
  "áàâãäéèêëíìîïóòôõöúùûüýÿçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÝŸÇÑ";
const ASCII_MAP =
  "aaaaaeeeeiiiiooooouuuuyycn" + "aaaaaeeeeiiiiooooouuuuyycn";

function replaceChain(expr: SQL, from: number, to: number): SQL {
  let e: SQL = expr;
  for (let i = from; i < to; i++) {
    e = sql`replace(${e}, ${ACCENT_MAP[i]!}, ${ASCII_MAP[i]!})`;
  }
  return e;
}

// SQLite has no translate(); nested replace() at full depth overflows the
// parser stack, so split into two 27-deep passes wrapped in a scalar subquery.
function normalizeNameSql(column: typeof playersTable.name): SQL {
  const half = Math.ceil(ACCENT_MAP.length / 2);
  return sql`(SELECT LOWER(${replaceChain(sql`c2`, half, ACCENT_MAP.length)}) FROM (SELECT ${replaceChain(sql`${column}`, 0, half)} AS c2))`;
}

type Db = Context["db"];

function normalizePlayersSubquery(db: Db) {
  const half = Math.ceil(ACCENT_MAP.length / 2);
  const inner = db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      rapid: playersTable.rapid,
      halfName: sql`${replaceChain(sql`${playersTable.name}`, 0, half)}`.as("half_name"),
    })
    .from(playersTable)
    .as("pn1");
  return db
    .select({
      id: inner.id,
      name: inner.name,
      rapid: inner.rapid,
      normName: sql`LOWER(${replaceChain(sql`${inner.halfName}`, half, ACCENT_MAP.length)})`.as("norm_name"),
    })
    .from(inner)
    .as("pn2");
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .trim();
}

function getBirthDateRange(group: string): [string, string] | undefined {
  const today = new Date();
  const year = today.getFullYear();

  switch (group) {
    case "sub-8":
      return [`${year - 8}-01-01`, `${year}-12-31`];
    case "sub-10":
      return [`${year - 10}-01-01`, `${year - 9}-12-31`];
    case "sub-12":
      return [`${year - 12}-01-01`, `${year - 11}-12-31`];
    case "sub-14":
      return [`${year - 14}-01-01`, `${year - 13}-12-31`];
    case "sub-16":
      return [`${year - 16}-01-01`, `${year - 15}-12-31`];
    case "sub-18":
      return [`${year - 18}-01-01`, `${year - 17}-12-31`];
    case "master":
      return [`${year - 50}-01-01`, `${year - 40}-12-31`];
    case "veterano":
      return [`${year - 64}-01-01`, `${year - 51}-12-31`];
    case "senior":
      return [`1900-01-01`, `${year - 65}-12-31`];
    default:
      return;
  }
}

export const playersRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.players.findMany({
      columns: {
        id: true,
        name: true,
        nickname: true,
        classic: true,
        rapid: true,
        blitz: true,
        imageUrl: true,
        birthDate: true,
        sex: true,
      },
      with: {
        club: { columns: { name: true, logoUrl: true } },
        location: { columns: { name: true, flagUrl: true } },
        defendingChampions: {
          columns: {},
          with: { championship: { columns: { name: true } } },
        },
        playersToTitles: {
          columns: { id: true, playerId: true, titleId: true },
          with: { title: { columns: { id: true, name: true, shortName: true, type: true } } },
        },
      },
    })
  ),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.players.findFirst({
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
          club: { columns: { name: true, logoUrl: true } },
          location: { columns: { name: true, flagUrl: true } },
          defendingChampions: {
            columns: {},
            with: { championship: { columns: { name: true } } },
          },
          playersToTournaments: {
            columns: { oldRating: true, variation: true },
            with: { tournament: { columns: { name: true, ratingType: true } } },
          },
          playersToRoles: {
            columns: {},
            with: { role: { columns: { name: true, shortName: true, type: true } } },
          },
          tournamentPodiums: {
            columns: { place: true },
            with: { tournament: { columns: { name: true, date: true, championshipId: true } } },
          },
          playersToTitles: {
            columns: {},
            with: { title: { columns: { name: true, shortName: true, type: true } } },
          },
        },
      })
    ),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ ctx, input }) => {
      const normalizedQuery = normalizeText(input.query);
      const words = normalizedQuery.split(/\s+/).filter(Boolean);

      if (words.length === 0) {
        return ctx.db
          .select({ id: playersTable.id, name: playersTable.name })
          .from(playersTable)
          .orderBy(desc(playersTable.rapid))
          .limit(10);
      }

      const normPlayers = normalizePlayersSubquery(ctx.db);

      const wordConditions = words.map(
        (word) => sql`${normPlayers.normName} LIKE ${`%${word}%`}`
      );

      const whereClause = sql.join(wordConditions, sql` AND `);

      const relevanceScore = sql<number>`
        CASE
          WHEN ${normPlayers.normName} = ${normalizedQuery} THEN 4
          WHEN ${normPlayers.normName} LIKE ${`${words[0]}%`} THEN 3
          WHEN ${normPlayers.normName} LIKE ${`%${normalizedQuery}%`} THEN 2
          ELSE 1
        END
      `;

      return ctx.db
        .select({ id: normPlayers.id, name: normPlayers.name })
        .from(normPlayers)
        .where(whereClause)
        .orderBy(desc(relevanceScore), desc(normPlayers.rapid), sql`LENGTH(${normPlayers.name})`)
        .limit(10);
    }),

  forEdit: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      ctx.db.query.players.findFirst({
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
      })
    ),

  create: adminProcedure
    .input(insertPlayerSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(playersTable).values(input).returning()
    ),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      nickname: z.string().nullable().optional(),
      blitz: z.number().optional(),
      rapid: z.number().optional(),
      classic: z.number().optional(),
      active: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
      cbxId: z.number().nullable().optional(),
      fideId: z.number().nullable().optional(),
      verified: z.boolean().optional(),
      birthDate: z.string().nullable().optional(),
      sex: z.enum(["male", "female"]).optional(),
      clubId: z.number().nullable().optional(),
      locationId: z.number().nullable().optional(),
      description: z.string().nullable().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(playersTable).set(input).where(eq(playersTable.id, input.id)).returning()
    ),

  withFilters: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      sex: z.enum(["male", "female"]).optional(),
      titles: z.array(z.string()).default([]),
      clubs: z.array(z.string()).default([]),
      groups: z.array(z.string()).default([]),
      locations: z.array(z.string()).default([]),
      sortBy: z.enum(["rapid", "blitz", "classic"]).default("rapid"),
      name: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20, sex, titles: titleFilters = [], clubs: clubFilters = [], groups: groupFilters = [], locations: locationFilters = [], sortBy = "rapid", name } = input;

      const whereConditions = [eq(playersTable.active, true)];

      if (name) {
        const normalizedQuery = normalizeText(name);
        whereConditions.push(
          sql`${normalizeNameSql(playersTable.name)} LIKE ${`%${normalizedQuery}%`}`
        );
      }
      if (sex) {
        whereConditions.push(eq(playersTable.sex, sex));
      }
      if (titleFilters.length) {
        whereConditions.push(inArray(titles.shortName, titleFilters));
      }
      if (clubFilters.length) {
        whereConditions.push(inArray(clubs.name, clubFilters));
      }
      if (groupFilters.length) {
        const groupConditions: ReturnType<typeof and>[] = [];
        for (const group of groupFilters) {
          const range = getBirthDateRange(group);
          if (range) {
            groupConditions.push(and(gte(playersTable.birthDate, range[0]), lte(playersTable.birthDate, range[1])));
          }
        }
        if (groupConditions.length > 0) {
          const condition = groupConditions.length === 1 ? groupConditions[0] : or(...groupConditions);
          if (condition) whereConditions.push(condition);
        }
      }
      if (locationFilters.length) {
        whereConditions.push(inArray(locations.name, locationFilters));
      }

      const countResult = await ctx.db
        .select({ count: count() })
        .from(playersTable)
        .leftJoin(playersToTitles, eq(playersTable.id, playersToTitles.playerId))
        .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
        .leftJoin(clubs, eq(playersTable.clubId, clubs.id))
        .leftJoin(locations, eq(playersTable.locationId, locations.id))
        .where(and(...whereConditions))
        .groupBy(playersTable.id);

      const uniquePlayerCount = countResult.length;
      const totalPages = Math.max(1, Math.ceil(uniquePlayerCount / limit));
      const offset = (page - 1) * limit;

      const sortColumn = playersTable[sortBy];

      const subquery = ctx.db
        .select({
          id: playersTable.id,
          sortValue: sortColumn,
        })
        .from(playersTable)
        .leftJoin(playersToTitles, eq(playersTable.id, playersToTitles.playerId))
        .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
        .leftJoin(clubs, eq(playersTable.clubId, clubs.id))
        .leftJoin(locations, eq(playersTable.locationId, locations.id))
        .where(and(...whereConditions))
        .groupBy(playersTable.id)
        .orderBy(desc(sortColumn))
        .limit(limit)
        .offset(offset)
        .as("subq");

      const rows = await ctx.db
        .select({
          id: playersTable.id,
          name: playersTable.name,
          nickname: playersTable.nickname,
          classic: playersTable.classic,
          rapid: playersTable.rapid,
          blitz: playersTable.blitz,
          imageUrl: playersTable.imageUrl,
          birthDate: playersTable.birthDate,
          sex: playersTable.sex,
          clubId: clubs.id,
          clubName: clubs.name,
          clubLogoUrl: clubs.logoUrl,
          locationName: locations.name,
          locationFlagUrl: locations.flagUrl,
          championshipName: championships.name,
          titleType: titles.type,
          titleName: titles.name,
          titleShortName: titles.shortName,
        })
        .from(playersTable)
        .leftJoin(playersToTitles, eq(playersTable.id, playersToTitles.playerId))
        .leftJoin(defendingChampions, eq(playersTable.id, defendingChampions.playerId))
        .leftJoin(championships, eq(defendingChampions.championshipId, championships.id))
        .leftJoin(titles, eq(playersToTitles.titleId, titles.id))
        .leftJoin(clubs, eq(playersTable.clubId, clubs.id))
        .leftJoin(locations, eq(playersTable.locationId, locations.id))
        .innerJoin(subquery, eq(playersTable.id, subquery.id))
        .orderBy(desc(sortColumn));

      const playersMap = new Map<number, {
        id: number;
        name: string;
        nickname: string | null;
        classic: number;
        rapid: number;
        blitz: number;
        imageUrl: string | null;
        birthDate: string | null;
        sex: string;
        club: { id: number; name: string; logoUrl: string };
        location: { name: string; flagUrl: string };
        defendingChampions: { championship: { name: string } }[];
        playersToTitles: { title: { type: string; name: string; shortName: string } }[];
      }>();

      for (const row of rows) {
        if (!playersMap.has(row.id)) {
          playersMap.set(row.id, {
            id: row.id,
            name: row.name,
            nickname: row.nickname,
            classic: row.classic,
            rapid: row.rapid,
            blitz: row.blitz,
            imageUrl: row.imageUrl,
            birthDate: row.birthDate,
            sex: row.sex,
            club: { id: row.clubId ?? 0, name: row.clubName ?? "", logoUrl: row.clubLogoUrl ?? "" },
            location: { name: row.locationName ?? "", flagUrl: row.locationFlagUrl ?? "" },
            defendingChampions: [],
            playersToTitles: [],
          });
        }

        const player = playersMap.get(row.id)!;

        if (row.championshipName) {
          const exists = player.defendingChampions.some(
            (c) => c.championship.name === row.championshipName
          );
          if (!exists) {
            player.defendingChampions.push({ championship: { name: row.championshipName } });
          }
        }

        if (row.titleShortName) {
          const exists = player.playersToTitles.some(
            (t) => t.title.shortName === row.titleShortName && t.title.type === row.titleType
          );
          if (!exists) {
            player.playersToTitles.push({
              title: { type: row.titleType!, name: row.titleName!, shortName: row.titleShortName },
            });
          }
        }
      }

      return {
        players: Array.from(playersMap.values()),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: uniquePlayerCount,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),
});
