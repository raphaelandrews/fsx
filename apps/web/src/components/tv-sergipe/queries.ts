import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@fsx/api/routers/index";

import {
  subScopeToFilters,
  type AgeGroup,
  type SubScopeId,
} from "./constants";

export interface TvSergipeFilters {
  tournamentId?: number;
  ageGroup?: AgeGroup;
  sex?: "male" | "female";
  modality?: "individual" | "team";
}

/**
 * Resolve the leaderboard filters from the URL search. Returns undefined for
 * unset scopes so tRPC omits those params from the query key.
 */
export function resolveTvSergipeFilters(input: {
  tournamentId?: number;
  idade?: AgeGroup;
  escopo?: SubScopeId;
}): TvSergipeFilters {
  const filters = input.idade ? subScopeToFilters(input.escopo ?? "geral") : {};
  return {
    tournamentId: input.tournamentId,
    ageGroup: input.idade,
    sex: filters.sex,
    modality: filters.modality,
  };
}

const OPTIONS = {
  // Public leaderboard is read-heavy and changes only when an admin edits a
  // result — long staleTime avoids refetch spam while navigating filters.
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const;

/** Editions with results, newest first; the first is the one shown by default. */
export function tvSergipeEditionsOptions(trpc: TRPCOptionsProxy<AppRouter>) {
  return {
    ...trpc.tvSergipe.editions.queryOptions(),
    ...OPTIONS,
  };
}

/** Full result list of one edition (single query), the source for the drilldown. */
export function tvSergipeListOptions(trpc: TRPCOptionsProxy<AppRouter>, tournamentId?: number) {
  return {
    ...trpc.tvSergipe.list.queryOptions({ tournamentId }),
    ...OPTIONS,
  };
}

/** Per-scope leaderboard. Deduplicated by filter key. */
export function tvSergipeLeaderboardOptions(
  trpc: TRPCOptionsProxy<AppRouter>,
  filters: TvSergipeFilters,
) {
  return {
    ...trpc.tvSergipe.leaderboard.queryOptions({
      tournamentId: filters.tournamentId,
      ageGroup: filters.ageGroup,
      sex: filters.sex,
      modality: filters.modality,
    }),
    ...OPTIONS,
  };
}
