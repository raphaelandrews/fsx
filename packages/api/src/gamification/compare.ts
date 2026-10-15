import type { Context } from "../context";
import { RATING_TYPES, type RatingType } from "../rating-types";
import { loadPlayerCareer, type Career } from "./load";
import { playerLevel } from "./level";
import { playerStats } from "./stats";

export const COMMON_TOURNAMENTS_LIMIT = 200;

function side(career: Career) {
  const stats = playerStats(career.input);
  const { player } = career;
  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    active: player.active,
    ratings: { classic: player.classic, rapid: player.rapid, blitz: player.blitz },
    level: playerLevel(career.input, stats).level,
    tournamentsPlayed: stats.tournamentsPlayed,
    medals: stats.medals.tournament,
    formats: Object.fromEntries(
      RATING_TYPES.map((type) => {
        const format = stats.formats[type];
        return [type, format ? { results: format.results, peak: format.peak.rating, bestGain: format.bestGain?.variation ?? null, bestStreak: format.bestStreak } : null];
      }),
    ) as Record<RatingType, { results: number; peak: number; bestGain: number | null; bestStreak: number } | null>,
  };
}

// Tournaments both played, newest first; each side's rating change in that tournament.
function commonTournaments(a: Career, b: Career) {
  const resultsOf = (career: Career) => new Map(career.input.results.map((result) => [result.tournament.id, result]));
  const ofB = resultsOf(b);
  return [...resultsOf(a)]
    .flatMap(([tournamentId, resultA]) => {
      const resultB = ofB.get(tournamentId);
      return resultB
        ? [
            {
              tournamentId,
              name: resultA.tournament.name,
              date: resultA.tournament.date,
              ratingType: resultA.ratingType,
              a: { oldRating: resultA.oldRating, variation: resultA.variation },
              b: { oldRating: resultB.oldRating, variation: resultB.variation },
            },
          ]
        : [];
    })
    .sort((x, y) => (y.date ?? "").localeCompare(x.date ?? "") || y.tournamentId - x.tournamentId)
    .slice(0, COMMON_TOURNAMENTS_LIMIT);
}

// Undefined when either player does not exist.
export async function comparePlayers(db: Context["db"], idA: number, idB: number) {
  const [a, b] = await Promise.all([loadPlayerCareer(db, idA), loadPlayerCareer(db, idB)]);
  if (!a || !b) return undefined;
  return { players: [side(a), side(b)] as const, common: commonTournaments(a, b) };
}
