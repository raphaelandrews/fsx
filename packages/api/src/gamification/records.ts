import { RATING_TYPES, type RatingType } from "../routers/rating-update";
import type { PlayerLevel } from "./level";
import type { PlayerStats, Provenance } from "./stats";

export const RECORD_SIZE = 10;
// One collator: localeCompare(…, "pt-BR") builds a new one per call, which
// dominated ranking thousands of players.
const byName = new Intl.Collator("pt-BR").compare;
const CHAMPIONSHIP_HOLDERS = 3;

export interface RecordPlayer {
  id: number;
  name: string;
  nickname: string | null;
  active: boolean;
}

export interface RecordEntry {
  place: number;
  player: RecordPlayer;
  value: number;
  // Context for the value: where it happened, or "anterior" for pre-record history.
  detail: string | null;
}

export interface CareerSummary {
  player: RecordPlayer;
  stats: PlayerStats;
  level: PlayerLevel;
  tournaments: Record<number, { name: string; date: string | null }>;
}

// Highest values first, equal values share a place (1, 1, 3). Ties are ordered
// by name so the list is stable.
function ranked(
  candidates: { player: RecordPlayer; value: number; tieBreak?: number; detail: string | null }[],
  size = RECORD_SIZE,
): RecordEntry[] {
  const sorted = candidates
    .filter((candidate) => candidate.value > 0)
    .sort(
      (a, b) =>
        b.value - a.value ||
        (b.tieBreak ?? 0) - (a.tieBreak ?? 0) ||
        byName(a.player.name, b.player.name),
    )
    .slice(0, size);
  let place = 0;
  return sorted.map((candidate, index) => {
    if (index === 0 || candidate.value !== sorted[index - 1]!.value) place = index + 1;
    return { place, player: candidate.player, value: candidate.value, detail: candidate.detail };
  });
}

function where(provenance: Provenance, tournaments: CareerSummary["tournaments"]): string | null {
  if (provenance.legacy) return "anterior";
  return provenance.tournamentId !== null ? (tournaments[provenance.tournamentId]?.name ?? null) : null;
}

export function playerRecords(careers: CareerSummary[], year: number) {
  const formats = (career: CareerSummary) =>
    Object.values(career.stats.formats).filter((format) => format !== null);

  const peaks = Object.fromEntries(
    RATING_TYPES.map((type) => [
      type,
      ranked(
        careers.flatMap((career) => {
          const format = career.stats.formats[type];
          return format
            ? [{ player: career.player, value: format.peak.rating, detail: where(format.peak, career.tournaments) }]
            : [];
        }),
      ),
    ]),
  ) as Record<RatingType, RecordEntry[]>;

  const championships = new Map<number, { name: string; holders: CareerSummary[] }>();
  for (const career of careers) {
    for (const dynasty of career.stats.dynasties) {
      const entry = championships.get(dynasty.championshipId) ?? { name: dynasty.championshipName, holders: [] };
      entry.holders.push(career);
      championships.set(dynasty.championshipId, entry);
    }
  }

  return {
    year,
    peaks,
    wins: ranked(careers.map((career) => ({ player: career.player, value: career.stats.medals.tournament.gold, detail: null }))),
    podiums: ranked(
      careers.map((career) => {
        const { gold, silver, bronze } = career.stats.medals.tournament;
        return { player: career.player, value: gold + silver + bronze, tieBreak: gold, detail: null };
      }),
    ),
    championships: [...championships]
      .map(([championshipId, { name, holders }]) => ({
        championshipId,
        name,
        holders: ranked(
          holders.map((career) => {
            const dynasty = career.stats.dynasties.find((d) => d.championshipId === championshipId)!;
            const years = dynasty.wins.flatMap((win) => (win.year === null ? [] : [win.year]));
            return { player: career.player, value: dynasty.wins.length, detail: years.join(", ") || null };
          }),
          CHAMPIONSHIP_HOLDERS,
        ),
      }))
      .sort((a, b) => byName(a.name, b.name)),
    streaks: ranked(
      careers.map((career) => ({
        player: career.player,
        value: Math.max(0, ...formats(career).map((format) => format.bestStreak)),
        detail: null,
      })),
    ),
    gains: ranked(
      careers.flatMap((career) => {
        const best = formats(career)
          .flatMap((format) => (format.bestGain ? [format.bestGain] : []))
          .sort((a, b) => b.variation - a.variation)[0];
        return best ? [{ player: career.player, value: best.variation, detail: where(best, career.tournaments) }] : [];
      }),
    ),
    activeThisYear: ranked(
      careers.map((career) => ({ player: career.player, value: career.stats.tournamentsByYear[year] ?? 0, detail: null })),
    ),
    levels: ranked(
      careers.map((career) => ({
        player: career.player,
        value: career.level.level,
        tieBreak: career.level.xp,
        detail: `${career.level.xp} XP`,
      })),
    ),
  };
}

export type PlayerRecords = ReturnType<typeof playerRecords>;
