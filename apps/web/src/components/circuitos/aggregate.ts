import type { Circuit, CircuitPhase, CircuitPlayer, ClubRow, PlayerRow } from "./types";

const CATEGORY_ORDER = ["Master", "Juvenil", "Futuro"];

const phaseName = (phase: CircuitPhase) => phase.tournament?.name ?? `Etapa ${phase.sortOrder}`;
export function sortedPhases(circuit: Circuit): CircuitPhase[] {
  return [...circuit.circuitPhases].sort((a, b) => b.sortOrder - a.sortOrder);
}

export function phaseNames(circuit: Circuit): string[] {
  return sortedPhases(circuit).map(phaseName);
}

export function circuitCategories(circuit: Circuit): string[] {
  const seen = new Set<string>();
  for (const phase of circuit.circuitPhases) {
    for (const podium of phase.circuitResults) {
      if (podium.category) seen.add(podium.category);
    }
  }
  return Array.from(seen).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
}

export function aggregatePlayers(circuit: Circuit, categories?: string[], splitByClub = false): PlayerRow[] {
  const map = new Map<string, PlayerRow>();

  const included = (category: string | null) =>
    !categories || categories.length === 0 || (category != null && categories.includes(category));

  const upsert = (player: CircuitPlayer, resultClub: CircuitPlayer["club"]): PlayerRow => {
    const club = resultClub ?? player.club;
    const key = splitByClub ? `${player.id}:${club?.id ?? ""}` : String(player.id);
    let row = map.get(key);
    if (!row) {
      row = {
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        imageUrl: player.imageUrl,
        playersToTitles: player.playersToTitles,
        club: splitByClub ? club : player.club,
        categories: [],
        total: 0,
        pointsByPhase: {},
      };
      map.set(key, row);
    }
    return row;
  };

  const apply = (
    player: CircuitPlayer,
    resultClub: CircuitPlayer["club"],
    points: number,
    category: string | null,
    phase?: string,
  ) => {
    const row = upsert(player, resultClub);
    row.total += points;
    if (phase) {
      row.pointsByPhase[phase] = (row.pointsByPhase[phase] ?? 0) + points;
    }
    if (category && !row.categories.includes(category)) {
      row.categories.push(category);
    }
  };

  for (const phase of circuit.circuitPhases) {
    const name = phaseName(phase);
    for (const podium of phase.circuitResults) {
      if (!included(podium.category)) continue;
      apply(podium.player, podium.club, podium.points ?? 0, podium.category, name);
    }
  }

  for (const podium of circuit.circuitResults) {
    if (!included(podium.category)) continue;
    apply(podium.player, podium.club, podium.points ?? 0, podium.category);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"),
  );
}

export function aggregateClubs(circuit: Circuit, categories?: string[]): ClubRow[] {
  const players = aggregatePlayers(circuit, categories, true);
  const map = new Map<string, ClubRow>();

  for (const player of players) {
    const clubName = player.club?.name ?? "Sem clube";
    let row = map.get(clubName);
    if (!row) {
      row = {
        clubId: player.club?.id ?? null,
        clubName,
        clubLogo: player.club?.logoUrl ?? null,
        total: 0,
        pointsByPhase: {},
        players: [],
      };
      map.set(clubName, row);
    }

    row.total += player.total;
    for (const [phase, points] of Object.entries(player.pointsByPhase)) {
      row.pointsByPhase[phase] = (row.pointsByPhase[phase] ?? 0) + points;
    }
    row.players.push(player);
  }

  const clubs = Array.from(map.values()).sort(
    (a, b) => b.total - a.total || a.clubName.localeCompare(b.clubName, "pt-BR"),
  );
  for (const club of clubs) {
    club.players.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
  }
  return clubs;
}
