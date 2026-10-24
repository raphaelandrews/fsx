import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, exists, gte, inArray, isNull, lte, ne, not, or, sql } from "drizzle-orm";

import { championships } from "@fsx/db/schema/championships";
import { circuitPhases } from "@fsx/db/schema/circuit-phases";
import { circuits } from "@fsx/db/schema/circuits";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/players-to-tournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { tournaments, insertTournamentSchema } from "@fsx/db/schema/tournaments";
import type { Context } from "../context";
import { adminProcedure, publicProcedure, router } from "../index";
import { requireFound, requireMutationRows } from "../errors";
import { assertDeletable } from "../services/delete-impact";
import { httpUrl, idInput, isoDate, nameText, page, positiveInt, ratingTypeSchema, searchText, seasonYear } from "../input-schemas";
import { paginate } from "../lib/pagination";
import { PUBLIC_COLLECTION_LIMIT, PUBLIC_NESTED_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { COMPETITION_TIERS, type CompetitionTier } from "../circuit-types";
import { TIER_SUGGESTION } from "../gamification/constants";
import { calibrateStrengthLines, suggestTier, type StrengthLines } from "../gamification/tier-suggestion";
import { computedResults } from "@fsx/db/schema/computed-results";
import { federationToday } from "../lib/dates";
import type { RatingType } from "../rating-types";
import { matchesAllWords, SEARCH_RESULT_LIMIT, SEARCH_SCAN_LIMIT, searchWords } from "../lib/name-search";

const tierEnum = z.enum(COMPETITION_TIERS);

export const TOURNAMENTS_PER_PAGE = 12;

// Kept apart from storedOrComputed: a calibration is an admin decision, not a cache a data change may drop.
// Three years of non-school results: about a hundred events of a few dozen players each.
const CALIBRATION_RATINGS_LIMIT = 20_000;
const TIER_CALIBRATION_KEY = "tier-calibration";

async function loadStrengthLines(db: Context["db"]) {
  const [row] = await db.select().from(computedResults).where(eq(computedResults.key, TIER_CALIBRATION_KEY)).limit(1);
  const defaults: StrengthLines = { ...TIER_SUGGESTION.minStrengthA };
  if (!row) return { lines: defaults, defaults, calibratedAt: null as number | null };
  const stored = JSON.parse(row.value) as StrengthLines;
  return { lines: stored, defaults, calibratedAt: row.computedAt as number | null };
}

const RATED_TOURNAMENT_MESSAGE =
  "This tournament has rating results. Revert them on the tournament's edit page before changing its rating type or deleting it.";

export const tournamentsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.tournaments.findMany({
      columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true, tier: true },
      with: {
        championship: { columns: { id: true, name: true } },
      },
       orderBy: (tournaments, { desc, asc }) => [desc(tournaments.date), asc(tournaments.id)],
       limit: PUBLIC_COLLECTION_LIMIT,
    })
  ),
  search: publicProcedure
    .input(z.object({ query: searchText }))
    .query(async ({ ctx, input }) => {
      const words = searchWords(input.query);
      const rows = await ctx.db
        .select({ id: tournaments.id, name: tournaments.name })
        .from(tournaments)
        .orderBy(desc(tournaments.date), desc(tournaments.id))
        .limit(SEARCH_SCAN_LIMIT);
      return rows.filter((tournament) => matchesAllWords(tournament.name, words)).slice(0, SEARCH_RESULT_LIMIT);
    }),
  // The public archive: newest first, filtered by the same dimensions the page shows.
  page: publicProcedure
    .input(
      z.object({
        page,
        year: seasonYear.optional(),
        tier: tierEnum.optional(),
        ratingType: ratingTypeSchema.optional(),
        championshipId: positiveInt.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        input.year ? gte(tournaments.date, `${input.year}-01-01`) : undefined,
        input.year ? lte(tournaments.date, `${input.year}-12-31`) : undefined,
        input.tier ? eq(tournaments.tier, input.tier) : undefined,
        input.ratingType ? eq(tournaments.ratingType, input.ratingType) : undefined,
        input.championshipId ? eq(tournaments.championshipId, input.championshipId) : undefined,
      );
      const [rows, totals, yearRows] = await ctx.db.batch([
        ctx.db
          .select({
            id: tournaments.id,
            name: tournaments.name,
            date: tournaments.date,
            ratingType: tournaments.ratingType,
            tier: tournaments.tier,
            // Aliased: D1 merges result columns that share a name (id, name).
            championshipId: sql<number | null>`${championships.id}`.as("championship_id"),
            championshipName: sql<string | null>`${championships.name}`.as("championship_name"),
          })
          .from(tournaments)
          .leftJoin(championships, eq(championships.id, tournaments.championshipId))
          .where(where)
          .orderBy(desc(tournaments.date), desc(tournaments.id))
          .limit(TOURNAMENTS_PER_PAGE)
          .offset((input.page - 1) * TOURNAMENTS_PER_PAGE),
        ctx.db.select({ value: count() }).from(tournaments).where(where),
        ctx.db
          .selectDistinct({ year: sql<string>`substr(${tournaments.date}, 1, 4)` })
          .from(tournaments)
          .where(sql`${tournaments.date} IS NOT NULL`)
          .orderBy(desc(sql`substr(${tournaments.date}, 1, 4)`)),
      ]);

      // Teams share first place, so a tournament can have several overall winners.
      const winners = rows.length
        ? await ctx.db
            .select({ tournamentId: tournamentPodiums.tournamentId, id: players.id, name: players.name })
            .from(tournamentPodiums)
            .innerJoin(players, eq(players.id, tournamentPodiums.playerId))
            .where(
              and(
                inArray(tournamentPodiums.tournamentId, rows.map((row) => row.id)),
                eq(tournamentPodiums.place, 1),
                isNull(tournamentPodiums.category),
              ),
            )
            .orderBy(asc(tournamentPodiums.id))
        : [];

      return {
        tournaments: rows.map((row) => ({
          id: row.id,
          name: row.name,
          date: row.date,
          ratingType: row.ratingType,
          tier: row.tier,
          championship: row.championshipId ? { id: row.championshipId, name: row.championshipName! } : null,
          winners: winners.filter((winner) => winner.tournamentId === row.id).map(({ id, name }) => ({ id, name })),
        })),
        pagination: paginate({ page: input.page, perPage: TOURNAMENTS_PER_PAGE, totalItems: totals[0]?.value ?? 0 }),
        years: yearRows.map((row) => Number(row.year)).filter(Number.isFinite),
      };
    }),
  // Every player's rating change in the tournament, best gain first (capped at the public collection limit).
  results: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    requireFound(
      await ctx.db.query.tournaments.findFirst({ where: eq(tournaments.id, input.id), columns: { id: true } }),
      "Tournament",
    );
    return ctx.db
      .select({
        id: playersToTournaments.id,
        playerId: players.id,
        name: players.name,
        oldRating: playersToTournaments.oldRating,
        variation: playersToTournaments.variation,
      })
      .from(playersToTournaments)
      .innerJoin(players, eq(players.id, playersToTournaments.playerId))
      .where(eq(playersToTournaments.tournamentId, input.id))
      .orderBy(desc(playersToTournaments.variation), asc(playersToTournaments.id))
      .limit(PUBLIC_COLLECTION_LIMIT);
  }),
  // Admin hint: the tier the field suggests (see gamification/tier-suggestion); never applied automatically.
  suggestedTier: adminProcedure.input(idInput).query(async ({ ctx, input }) => {
    const tournament = requireFound(
      await ctx.db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.id),
        columns: { tier: true, ratingType: true },
      }),
      "Tournament",
    );
    const rows = await ctx.db
      .select({ oldRating: playersToTournaments.oldRating })
      .from(playersToTournaments)
      .where(eq(playersToTournaments.tournamentId, input.id))
      .limit(PUBLIC_COLLECTION_LIMIT);
    return {
      current: tournament.tier as CompetitionTier,
      ...suggestTier({
        tier: tournament.tier as CompetitionTier,
        ratingType: tournament.ratingType as RatingType,
        ratings: rows.map((row) => row.oldRating),
        lines: (await loadStrengthLines(ctx.db)).lines,
      }),
    };
  }),
  tierCalibration: adminProcedure.query(({ ctx }) => loadStrengthLines(ctx.db)),
  // Recomputes the Tier A strength lines from the recent results of every non-school tournament. Existing tiers stay as they are.
  recalibrateTier: adminProcedure.mutation(async ({ ctx }) => {
    const today = federationToday();
    const since = `${Number(today.slice(0, 4)) - TIER_SUGGESTION.calibrationYears}${today.slice(4)}`;
    const current = await loadStrengthLines(ctx.db);
    const events = await ctx.db
      .select({ id: tournaments.id, ratingType: tournaments.ratingType, date: tournaments.date, championship: championships.name })
      .from(tournaments)
      .leftJoin(championships, eq(championships.id, tournaments.championshipId))
      .where(and(ne(tournaments.tier, "school"), gte(tournaments.date, since)))
      .limit(PUBLIC_COLLECTION_LIMIT);
    const ratings = events.length
      ? await ctx.db
          .select({ tournamentId: playersToTournaments.tournamentId, oldRating: playersToTournaments.oldRating })
          .from(playersToTournaments)
          .innerJoin(tournaments, eq(tournaments.id, playersToTournaments.tournamentId))
          .where(and(ne(tournaments.tier, "school"), gte(tournaments.date, since)))
          .limit(CALIBRATION_RATINGS_LIMIT)
      : [];
    const lines = calibrateStrengthLines(
      events.map((event) => ({
        ratingType: event.ratingType as RatingType,
        date: event.date,
        championship: event.championship,
        ratings: ratings.filter((row) => row.tournamentId === event.id).map((row) => row.oldRating),
      })),
      today,
      current.defaults,
    );
    const now = Date.now();
    await ctx.db
      .insert(computedResults)
      .values({ key: TIER_CALIBRATION_KEY, value: JSON.stringify(lines), computedAt: now })
      .onConflictDoUpdate({ target: computedResults.key, set: { value: JSON.stringify(lines), computedAt: now } });
    return { previous: current.lines, lines, calibratedAt: now };
  }),
  byId: publicProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => {
      const [tournament, stages] = await Promise.all([
        ctx.db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.id),
        columns: { id: true, name: true, chessResults: true, date: true, ratingType: true, championshipId: true, tier: true },
        with: {
          championship: { columns: { id: true, name: true } },
          tournamentPodiums: {
            limit: PUBLIC_NESTED_COLLECTION_LIMIT,
            columns: { id: true, place: true, category: true, playerId: true },
            orderBy: (podium, { asc }) => [asc(podium.category), asc(podium.place), asc(podium.id)],
            with: {
              player: { columns: { id: true, name: true, nickname: true, imageUrl: true } },
            },
          },
        },
        }),
        // The circuit seasons this tournament is a stage of, for the page's breadcrumbs.
        ctx.db
          .select({ id: circuits.id, name: circuits.name, year: circuits.year })
          .from(circuitPhases)
          .innerJoin(circuits, eq(circuits.id, circuitPhases.circuitId))
          .where(eq(circuitPhases.tournamentId, input.id))
          .limit(PUBLIC_NESTED_COLLECTION_LIMIT),
      ]);
      return { ...requireFound(tournament, "Tournament"), circuits: stages };
    }),
  create: adminProcedure
    .input(insertTournamentSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      name: nameText,
      chessResults: httpUrl.nullable().optional(),
      date: isoDate.nullable().optional(),
      ratingType: ratingTypeSchema,
      championshipId: positiveInt.nullable().optional(),
      tier: tierEnum.default("B"),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(tournaments).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      name: nameText.optional(),
      chessResults: httpUrl.nullable().optional(),
      date: isoDate.nullable().optional(),
      ratingType: ratingTypeSchema.optional(),
      championshipId: positiveInt.nullable().optional(),
      tier: tierEnum.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasResults = exists(
        ctx.db.select({ id: playersToTournaments.id }).from(playersToTournaments).where(eq(playersToTournaments.tournamentId, input.id)),
      );
      const rows = await ctx.db
        .update(tournaments)
        .set(input)
        .where(and(
          eq(tournaments.id, input.id),
          input.ratingType ? or(eq(tournaments.ratingType, input.ratingType), not(hasResults)) : undefined,
        ))
        .returning();
      if (rows.length === 0 && input.ratingType && await tournamentExists(ctx.db, input.id)) {
        throw new TRPCError({ code: "CONFLICT", message: RATED_TOURNAMENT_MESSAGE });
      }
      return requireMutationRows(rows, "Tournament");
    }),
  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await assertDeletable(ctx.db, "tournament", input.id);
    return requireMutationRows(
      await ctx.db
        .delete(tournaments)
        .where(eq(tournaments.id, input.id))
        .returning({ id: tournaments.id }),
      "Tournament",
    );
  }),
});

async function tournamentExists(db: Context["db"], id: number) {
  return (await db.query.tournaments.findFirst({ where: eq(tournaments.id, id), columns: { id: true } })) !== undefined;
}
