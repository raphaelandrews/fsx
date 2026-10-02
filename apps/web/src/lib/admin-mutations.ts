import type { AppRouter } from "@fsx/api/routers/index";
import { useQueryClient, type QueryClient, type QueryFilters } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";

import { useTRPC } from "@/utils/trpc";

type RouterKey = keyof inferRouterInputs<AppRouter>;

const PLAYER_VIEWS = [
  "players",
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
] as const satisfies readonly RouterKey[];

// Every router whose queries embed the mutated domain's rows. Admin mutations
// invalidate whole routers here, so a nested name/image edit refreshes every
// list, detail, and public view that renders it.
export const ADMIN_QUERY_DEPENDENTS = {
  announcements: ["announcements", "stats"],
  champions: ["champions", "tournaments", "players", "topPlayers"],
  circuits: ["circuits", "stats"],
  clubs: ["clubs", "players", "circuits", "tvSergipe", "swissManager"],
  cups: ["cups"],
  events: ["events", "links", "stats"],
  insignias: ["insignias", "playersToInsignias"],
  links: ["links", "events"],
  locations: ["locations", "players", "swissManager"],
  norms: ["norms"],
  players: [...PLAYER_VIEWS, "stats"],
  playersToInsignias: ["playersToInsignias", "players"],
  playersToRoles: ["playersToRoles", "roles", "players"],
  playersToTitles: ["playersToTitles", "titledPlayers", "topPlayers", "players"],
  playersTournament: ["players", "topPlayers", "titledPlayers", "swissManager"],
  posts: ["posts", "stats"],
  roles: ["roles", "playersToRoles", "players"],
  titles: ["titles", "playersToTitles", "titledPlayers", "topPlayers", "players"],
  tournamentPodiums: ["tournamentPodiums", "tournaments", "champions", "players"],
  tournaments: ["tournaments", "tournamentPodiums", "champions", "players", "stats"],
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
