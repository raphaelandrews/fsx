import { CIRCUIT_TYPES_BY_CATEGORY, type CircuitType, type CompetitionCategory } from "./circuit-types";

export const FINAL_PODIUM_PLACES = 3;

export interface CircuitPointsRow {
  playerId: number;
  points: number;
  category: CompetitionCategory | null;
}

export interface CircuitPlacing {
  playerId: number;
  category: CompetitionCategory | null;
  place: number;
  points: number;
}

// Equal totals share a place, so a podium can hold more than three players.
export function circuitFinalPodiums(type: CircuitType, rows: CircuitPointsRow[]): CircuitPlacing[] {
  return rankCircuit(type, rows).filter((placing) => placing.place <= FINAL_PODIUM_PLACES);
}

// Mirrors the public ranking (components/circuitos/aggregate.ts): points are
// summed per player, per category only for layouts that rank categories apart.
// Equal totals share a place (1, 1, 3).
export function rankCircuit(type: CircuitType, rows: CircuitPointsRow[]): CircuitPlacing[] {
  const byCategory = CIRCUIT_TYPES_BY_CATEGORY.includes(type);
  const groups = new Map<CompetitionCategory | null, Map<number, number>>();
  for (const row of rows) {
    const category = byCategory ? row.category : null;
    const totals = groups.get(category) ?? new Map<number, number>();
    totals.set(row.playerId, (totals.get(row.playerId) ?? 0) + row.points);
    groups.set(category, totals);
  }

  const placings: CircuitPlacing[] = [];
  for (const [category, totals] of groups) {
    const ranked = [...totals]
      .filter(([, points]) => points > 0)
      .sort(([playerA, pointsA], [playerB, pointsB]) => pointsB - pointsA || playerA - playerB);
    let place = 0;
    ranked.forEach(([playerId, points], index) => {
      if (index === 0 || points !== ranked[index - 1]![1]) place = index + 1;
      placings.push({ playerId, category, place, points });
    });
  }
  return placings;
}
