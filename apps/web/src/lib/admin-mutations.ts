import type { AppRouter } from "@fsx/api/routers/index";
import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryFilters,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";

import { toast } from "sonner";

import { showMutationError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

type RouterKey = keyof inferRouterInputs<AppRouter>;

const PLAYER_VIEWS = [
  "players",
  "announcements",
  "topPlayers",
  "titledPlayers",
  "champions",
  "circuits",
  "roles",
  "tournaments",
  "tournamentPodiums",
  "cups",
  "tvSergipe",
  "swissManager",
  "records",
  "clubs",
] as const satisfies readonly RouterKey[];

// Every router whose queries embed the mutated domain's rows. Admin mutations
// invalidate whole routers here, so a nested name/image edit refreshes every
// list, detail, and public view that renders it.
export const ADMIN_QUERY_DEPENDENTS = {
  announcements: ["announcements", "records", "stats"],
  champions: ["champions", "tournaments", "circuits", "players", "topPlayers", "records"],
  circuits: ["circuits", "players", "records", "clubs", "stats"],
  clubs: ["clubs", "players", "circuits", "tvSergipe", "swissManager", "records"],
  cups: ["cups"],
  events: ["events", "links", "stats"],
  insignias: ["insignias", "playersToInsignias"],
  links: ["links", "events"],
  locations: ["locations", "players", "swissManager", "records"],
  norms: ["norms"],
  players: [...PLAYER_VIEWS, "stats"],
  playersToInsignias: ["playersToInsignias", "players"],
  playersToRoles: ["playersToRoles", "roles", "players"],
  playersToTitles: ["playersToTitles", "titledPlayers", "topPlayers", "players", "records"],
  playersTournament: ["playersTournament", "players", "playersToTitles", "topPlayers", "titledPlayers", "swissManager", "records", "clubs"],
  posts: ["posts", "stats"],
  roles: ["roles", "playersToRoles", "players"],
  titles: ["titles", "playersToTitles", "titledPlayers", "topPlayers", "players", "records"],
  tournamentPodiums: ["tournamentPodiums", "tournaments", "champions", "players", "records", "clubs"],
  tournaments: ["tournaments", "tournamentPodiums", "champions", "circuits", "players", "records", "stats"],
  tvSergipe: ["tvSergipe", "stats"],
} as const satisfies Partial<Record<RouterKey, readonly RouterKey[]>>;

export type AdminDomain = keyof typeof ADMIN_QUERY_DEPENDENTS;

export async function invalidateAdminQueries(
  queryClient: QueryClient,
  filters: QueryFilters[],
): Promise<void> {
  await Promise.all(filters.map((filters) => queryClient.invalidateQueries(filters)));
}

export function useInvalidateAdmin() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return (domain: AdminDomain) =>
    invalidateAdminQueries(
      queryClient,
      ADMIN_QUERY_DEPENDENTS[domain].map((key) => trpc[key].pathFilter()),
    );
}

type AdminMutationConfig<TData, TVariables> = {
  /** Query families refreshed after success (see ADMIN_QUERY_DEPENDENTS). */
  invalidates?: AdminDomain | AdminDomain[];
  /** Wait for the refetch before running onSuccess, e.g. before leaving the page. */
  awaitInvalidation?: boolean;
  success?: string;
  failure: string;
  /** Offer a reload when the server reports CONFLICT (concurrent edits). */
  reloadOnConflict?: boolean;
  onSuccess?: (data: TData, variables: TVariables) => unknown;
  onError?: (error: unknown, variables: TVariables) => unknown;
};

/** The standard admin mutation: invalidate, toast, then any route-specific follow-up. */
export function useAdminMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  config: AdminMutationConfig<TData, TVariables>,
) {
  const invalidateAdmin = useInvalidateAdmin();
  return useMutation({
    ...options,
    onSuccess: async (data, variables) => {
      const refreshed = Promise.all([config.invalidates ?? []].flat().map((domain) => invalidateAdmin(domain)));
      if (config.awaitInvalidation) await refreshed;
      if (config.success) toast.success(config.success);
      await config.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      void config.onError?.(error, variables);
      showMutationError(error, config.failure, config.reloadOnConflict ? () => window.location.reload() : undefined);
    },
  });
}
