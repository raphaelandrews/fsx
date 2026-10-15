import type { CompetitionTier } from "@fsx/api/circuit-types";
import type { RatingType } from "@fsx/api/rating-types";

export const TIER_LABELS: Record<CompetitionTier, string> = {
  S: "Sergipano",
  A: "Nível A",
  B: "Nível B",
  school: "Escolar",
};

export const RHYTHM_LABELS: Record<RatingType, string> = {
  classic: "Clássico",
  rapid: "Rápido",
  blitz: "Blitz",
};

export type TournamentSearch = {
  page: number;
  ano?: number;
  nivel?: CompetitionTier;
  ritmo?: RatingType;
  campeonato?: number;
};

/** The `tournaments.page` input for the address's search parameters. */
export const pageInput = (search: TournamentSearch) => ({
  page: search.page,
  year: search.ano,
  tier: search.nivel,
  ratingType: search.ritmo,
  championshipId: search.campeonato,
});

export const hasFilters = (search: TournamentSearch) =>
  search.ano !== undefined || search.nivel !== undefined || search.ritmo !== undefined || search.campeonato !== undefined;
