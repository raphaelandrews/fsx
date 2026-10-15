import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@fsx/api/routers/index";

import {
  subScopeToFilters,
  type AgeGroup,
  type SubScopeId,
} from "./constants";

export interface TvSergipeFilters {
  ageGroup?: AgeGroup;
  sex?: "male" | "female";
  modality?: "individual" | "team";
}

/**
 * Resolve the leaderboard filters from the URL search. Returns undefined for
 * unset scopes so tRPC omits those params from the query key.
 */
export function resolveTvSergipeFilters(input: {
  idade?: AgeGroup;
  escopo?: SubScopeId;
}): TvSergipeFilters {
  const filters = input.idade ? subScopeToFilters(input.escopo ?? "geral") : {};
  return {
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

/** Full result list (single query), the source for the drilldown. */
export function tvSergipeListOptions(trpc: TRPCOptionsProxy<AppRouter>) {
  return {
    ...trpc.tvSergipe.list.queryOptions(),
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
      ageGroup: filters.ageGroup,
      sex: filters.sex,
      modality: filters.modality,
    }),
    ...OPTIONS,
  };
}
