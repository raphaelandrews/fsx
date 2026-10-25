import { and, between, eq, inArray, sql, type SQL } from "drizzle-orm";

import type { createDb } from "@fsx/db";
import { MEDAL_PLACES } from "@fsx/db/competition";
import { circuitPhases } from "@fsx/db/schema/circuit-phases";
import { circuitResults } from "@fsx/db/schema/circuit-results";
import { tournaments } from "@fsx/db/schema/tournaments";
import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";

type Database = ReturnType<typeof createDb>;

// Stage places 1-3 mirror into tournament podiums unless the stage's tournament has podiums turned
// off. A synced row replaces a hand-entered podium for the same
// player, tournament and category, since the unique indexes allow only one; when two results
// claim the same key (one tournament in two circuits), the first one synced keeps it.
const syncStatements = (db: Database, resultFilter: SQL) => {
  const medalResults = and(resultFilter, eq(tournaments.hasPodiums, true), between(circuitResults.place, 1, MEDAL_PLACES));
  const medalRows = db
    .select({
      id: sql<number>`NULL`.as("id"),
      playerId: circuitResults.playerId,
      tournamentId: circuitPhases.tournamentId,
      place: sql<number>`${circuitResults.place}`.as("place"),
      category: circuitResults.category,
      circuitResultId: circuitResults.id,
      tvSergipeId: sql<number>`NULL`.as("tv_sergipe_id"),
      createdAt: sql<string>`CURRENT_TIMESTAMP`.as("created_at"),
      updatedAt: sql<string>`CURRENT_TIMESTAMP`.as("updated_at"),
    })
    .from(circuitResults)
    .innerJoin(circuitPhases, eq(circuitPhases.id, circuitResults.circuitPhaseId))
    .innerJoin(tournaments, eq(tournaments.id, circuitPhases.tournamentId))
    .where(medalResults);

  return [
    db
      .delete(tournamentPodiums)
      .where(inArray(tournamentPodiums.circuitResultId, db.select({ id: circuitResults.id }).from(circuitResults).where(resultFilter))),
    db.delete(tournamentPodiums).where(
      sql`EXISTS (
        SELECT 1 FROM ${circuitResults}
        JOIN ${circuitPhases} ON ${circuitPhases.id} = ${circuitResults.circuitPhaseId}
        JOIN ${tournaments} ON ${tournaments.id} = ${circuitPhases.tournamentId}
        WHERE ${medalResults}
          AND ${circuitResults.playerId} = ${tournamentPodiums.playerId}
          AND ${circuitPhases.tournamentId} = ${tournamentPodiums.tournamentId}
          AND ${circuitResults.category} IS ${tournamentPodiums.category}
          AND ${tournamentPodiums.circuitResultId} IS NULL
          AND ${tournamentPodiums.tvSergipeId} IS NULL
      )`,
    ),
    db.insert(tournamentPodiums).select(medalRows).onConflictDoNothing(),
  ] as const;
};

export const syncStageResultPodium = (db: Database, resultId: number) =>
  syncStatements(db, eq(circuitResults.id, resultId));

export const syncJustInsertedStageResultPodium = (db: Database) =>
  syncStatements(db, sql`${circuitResults.id} = last_insert_rowid()`);

export const syncPhasePodiums = (db: Database, phaseId: number) =>
  syncStatements(db, eq(circuitResults.circuitPhaseId, phaseId));

export const syncCircuitResults = (db: Database, circuitId: number) =>
  syncStatements(
    db,
    inArray(circuitResults.circuitPhaseId, db.select({ id: circuitPhases.id }).from(circuitPhases).where(eq(circuitPhases.circuitId, circuitId))),
  );

export const syncTournamentStageResults = (db: Database, tournamentId: number) =>
  syncStatements(
    db,
    inArray(circuitResults.circuitPhaseId, db.select({ id: circuitPhases.id }).from(circuitPhases).where(eq(circuitPhases.tournamentId, tournamentId))),
  );
