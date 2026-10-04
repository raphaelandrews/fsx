import { eq, inArray, or } from "drizzle-orm";

import { circuitFinalPodiums } from "@fsx/db/schema/circuitFinalPodiums";
import { circuitPhases } from "@fsx/db/schema/circuitPhases";
import { circuitPodiums } from "@fsx/db/schema/circuitPodiums";
import { players } from "@fsx/db/schema/players";

import { rankCircuit } from "../circuit-standings";
import type { CircuitType, CompetitionCategory } from "../circuit-types";
import type { Context } from "../context";
import { PLAYER_RESULTS_LIMIT } from "./constants";

// Every points row of the seasons in progress the player is ranked in.
const SEASON_POINTS_LIMIT = 20_000;

export interface PlayerCircuitSeason {
  circuit: { id: number; name: string; year: number | null; type: string; finishedAt: string | null };
  stagesPlayed: number;
  points: number;
  // Seasons in progress: the player's live position per category.
  standings: { category: string | null; position: number; players: number }[];
  // Finished seasons: the official final podiums, never recomputed from points.
  finalPodiums: { category: string | null; place: number }[];
}

const circuitColumns = { columns: { id: true, name: true, year: true, type: true, finishedAt: true } } as const;

// Undefined for an unknown player, so callers can raise NOT_FOUND.
export async function loadPlayerCircuits(db: Context["db"], playerId: number): Promise<PlayerCircuitSeason[] | undefined> {
  const [[player], rows, finals] = await db.batch([
    db.query.players.findMany({ where: eq(players.id, playerId), columns: { id: true }, limit: 1 }),
    db.query.circuitPodiums.findMany({
      where: eq(circuitPodiums.playerId, playerId),
      columns: { points: true, circuitPhaseId: true },
      limit: PLAYER_RESULTS_LIMIT,
      with: {
        circuit: circuitColumns,
        circuitPhases: { columns: { id: true }, with: { circuit: circuitColumns } },
      },
    }),
    db.query.circuitFinalPodiums.findMany({
      where: eq(circuitFinalPodiums.playerId, playerId),
      columns: { category: true, place: true },
      limit: PLAYER_RESULTS_LIMIT,
      with: { circuit: circuitColumns },
    }),
  ]);
  if (!player) return undefined;

  const seasons = new Map<number, PlayerCircuitSeason & { stages: Set<number> }>();
  const season = (circuit: PlayerCircuitSeason["circuit"]) => {
    const entry = seasons.get(circuit.id) ?? { circuit, stagesPlayed: 0, points: 0, standings: [], finalPodiums: [], stages: new Set() };
    seasons.set(circuit.id, entry);
    return entry;
  };
  for (const row of rows) {
    const circuit = row.circuitPhases?.circuit ?? row.circuit;
    if (!circuit) continue;
    const entry = season(circuit);
    entry.points += row.points;
    if (row.circuitPhaseId !== null) entry.stages.add(row.circuitPhaseId);
  }
  for (const final of finals) {
    season(final.circuit).finalPodiums.push({ category: final.category, place: final.place });
  }

  const inProgress = [...seasons.values()].filter((entry) => !entry.circuit.finishedAt).map((entry) => entry.circuit.id);
  if (inProgress.length > 0) {
    const points = await db
      .select({
        playerId: circuitPodiums.playerId,
        points: circuitPodiums.points,
        category: circuitPodiums.category,
        circuitId: circuitPhases.circuitId,
        directCircuitId: circuitPodiums.circuitId,
      })
      .from(circuitPodiums)
      .leftJoin(circuitPhases, eq(circuitPhases.id, circuitPodiums.circuitPhaseId))
      .where(or(inArray(circuitPhases.circuitId, inProgress), inArray(circuitPodiums.circuitId, inProgress)))
      .limit(SEASON_POINTS_LIMIT);
    for (const id of inProgress) {
      const entry = seasons.get(id)!;
      const ranking = rankCircuit(
        entry.circuit.type as CircuitType,
        points
          .filter((row) => (row.circuitId ?? row.directCircuitId) === id)
          .map((row) => ({ playerId: row.playerId, points: row.points, category: row.category as CompetitionCategory | null })),
      );
      for (const placing of ranking.filter((placing) => placing.playerId === playerId)) {
        entry.standings.push({
          category: placing.category,
          position: placing.place,
          players: ranking.filter((other) => other.category === placing.category).length,
        });
      }
    }
  }

  return [...seasons.values()]
    .map(({ stages, ...entry }) => ({ ...entry, stagesPlayed: stages.size }))
    .sort((a, b) => (b.circuit.year ?? 0) - (a.circuit.year ?? 0) || a.circuit.name.localeCompare(b.circuit.name, "pt-BR"));
}
