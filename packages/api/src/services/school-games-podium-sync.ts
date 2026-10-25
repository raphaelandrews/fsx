import { and, between, eq, inArray, isNotNull, sql, type SQL } from "drizzle-orm";

import type { createDb } from "@fsx/db";
import { MEDAL_PLACES } from "@fsx/db/competition";
import { categories } from "@fsx/db/schema/categories";
import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { tournaments } from "@fsx/db/schema/tournaments";
import { tvSergipe } from "@fsx/db/schema/tv-sergipe";

type Database = ReturnType<typeof createDb>;

// Individual School Games medal places become tournament podiums in the age category matching the
// result's age group and sex ("Sub 10 Feminino"), skipped when no such category exists. Team results
// have no player, so they stay in the school standings.
// Same replace rules as stage-podium-sync: a synced row takes over a hand-entered podium for the
// same player, tournament and category, and the first synced result keeps a contested key.
const syncStatements = (db: Database, resultFilter: SQL) => {
  // A join, not a scalar subquery: drizzle drops table names inside a single-table select, which
  // would make `sex = sex` compare the categories column with itself.
  const ageCategory = and(
    eq(categories.kind, "age"),
    eq(categories.sex, tvSergipe.sex),
    sql`${categories.ageLimit} = CAST(${tvSergipe.ageGroup} AS INTEGER)`,
  );
  const medalResults = and(
    resultFilter,
    eq(tvSergipe.modality, "individual"),
    isNotNull(tvSergipe.tournamentId),
    between(tvSergipe.place, 1, MEDAL_PLACES),
    eq(tournaments.hasPodiums, true),
  );
  const medalRows = db
    .select({
      id: sql<number>`NULL`.as("id"),
      playerId: sql<number>`${tvSergipe.playerId}`.as("player_id"),
      tournamentId: sql<number>`${tvSergipe.tournamentId}`.as("tournament_id"),
      place: sql<number>`${tvSergipe.place}`.as("place"),
      category: categories.name,
      circuitResultId: sql<number>`NULL`.as("circuit_result_id"),
      tvSergipeId: tvSergipe.id,
      createdAt: sql<string>`CURRENT_TIMESTAMP`.as("created_at"),
      updatedAt: sql<string>`CURRENT_TIMESTAMP`.as("updated_at"),
    })
    .from(tvSergipe)
    .innerJoin(categories, ageCategory)
    .innerJoin(tournaments, eq(tournaments.id, tvSergipe.tournamentId))
    .where(medalResults);

  return [
    db
      .delete(tournamentPodiums)
      .where(inArray(tournamentPodiums.tvSergipeId, db.select({ id: tvSergipe.id }).from(tvSergipe).where(resultFilter))),
    db.delete(tournamentPodiums).where(
      sql`EXISTS (
        SELECT 1 FROM ${tvSergipe}
        JOIN ${categories} ON ${ageCategory}
        JOIN ${tournaments} ON ${tournaments.id} = ${tvSergipe.tournamentId}
        WHERE ${medalResults}
          AND ${tvSergipe.playerId} = ${tournamentPodiums.playerId}
          AND ${tvSergipe.tournamentId} = ${tournamentPodiums.tournamentId}
          AND ${categories.name} = ${tournamentPodiums.category}
          AND ${tournamentPodiums.circuitResultId} IS NULL
          AND ${tournamentPodiums.tvSergipeId} IS NULL
      )`,
    ),
    db.insert(tournamentPodiums).select(medalRows).onConflictDoNothing(),
  ] as const;
};

export const syncSchoolGamesResultPodium = (db: Database, resultId: number) =>
  syncStatements(db, eq(tvSergipe.id, resultId));

export const syncJustInsertedSchoolGamesResultPodium = (db: Database) =>
  syncStatements(db, sql`${tvSergipe.id} = last_insert_rowid()`);

export const syncSchoolGamesEditionPodiums = (db: Database, tournamentId: number) =>
  syncStatements(db, eq(tvSergipe.tournamentId, tournamentId));
