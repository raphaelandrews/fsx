import { RATING_TYPES, type RatingType } from "../routers/rating-update";
import { achievementsOf } from "./badges";
import { playerLevel, type LevelInput } from "./level";
import { playerStats, type StatsInput } from "./stats";

type CareerInput = StatsInput & LevelInput;

const dated = (date: string | null, lastDay: string) => date === null || date <= lastDay;

// The career as it stood at the end of `lastDay` (YYYY-MM-DD). Each rating is the
// chain's rating then, not today's, so a rating step counts in the year it was
// reached. Undated rows and titles (which carry no date) are kept on both sides
// of a comparison, so they cancel out.
export function careerUpTo(input: CareerInput, lastDay: string): CareerInput {
  const results = input.results.filter((result) => dated(result.tournament.date, lastDay));
  const ratings = Object.fromEntries(
    RATING_TYPES.map((type) => {
      const chain = input.results.filter((result) => result.ratingType === type).sort((a, b) => a.id - b.id);
      const kept = results.filter((result) => result.ratingType === type).sort((a, b) => a.id - b.id);
      const last = kept.at(-1);
      const rating = last ? last.oldRating + last.variation : chain.length > 0 ? chain[0]!.oldRating : input.ratings[type];
      return [type, rating];
    }),
  ) as Record<RatingType, number>;
  return {
    ratings,
    results,
    tournamentPodiums: input.tournamentPodiums.filter((podium) => dated(podium.tournament.date, lastDay)),
    circuitStageResults: input.circuitStageResults.filter((stage) => dated(stage.date, lastDay)),
    circuitFinalPodiums: input.circuitFinalPodiums.filter((podium) => dated(podium.circuit.date, lastDay)),
    titleTiers: input.titleTiers,
  };
}

const levelAt = (input: CareerInput, lastDay: string) => {
  const career = careerUpTo(input, lastDay);
  return playerLevel(career, playerStats(career));
};

// One year of a career, from the same stats module as the profile. Undated
// results cannot be placed in a year and are left out.
export function playerSeason(input: CareerInput, year: number) {
  const inYear = (date: string | null) => date !== null && date.startsWith(`${year}-`);
  const stats = playerStats(input);
  const results = input.results.filter((result) => inYear(result.tournament.date));

  const ratingChange = Object.fromEntries(
    RATING_TYPES.map((type) => {
      const ofType = results.filter((result) => result.ratingType === type);
      return [type, ofType.length > 0 ? ofType.reduce((sum, result) => sum + result.variation, 0) : null];
    }),
  ) as Record<RatingType, number | null>;
  const best = results.filter((result) => result.variation > 0).sort((a, b) => b.variation - a.variation)[0];

  const months = Array.from({ length: 12 }, () => 0);
  for (const { date } of stats.played) if (inYear(date)) months[Number(date!.slice(5, 7)) - 1]!++;

  const end = levelAt(input, `${year}-12-31`);
  const start = levelAt(input, `${year - 1}-12-31`);

  return {
    year,
    seasons: stats.seasons,
    tournamentsPlayed: stats.tournamentsByYear[year] ?? 0,
    months,
    ratingChange,
    bestGain: best ? { variation: best.variation, tournamentId: best.tournament.id, date: best.tournament.date } : null,
    podiums: [
      ...input.tournamentPodiums
        .filter((podium) => podium.place <= 3 && inYear(podium.tournament.date))
        .map((podium) => ({ place: podium.place, category: podium.category, name: podium.tournament.name, date: podium.tournament.date })),
      ...input.circuitFinalPodiums
        .filter((podium) => podium.place <= 3 && inYear(podium.circuit.date))
        .map((podium) => ({ place: podium.place, category: podium.category, name: podium.circuit.name, date: podium.circuit.date })),
    ].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")),
    achievements: achievementsOf(stats).filter((achievement) => inYear(achievement.earnedAt)),
    xpGained: end.xp - start.xp,
    level: end.level,
  };
}

export type PlayerSeason = ReturnType<typeof playerSeason>;
