import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APISearchPlayersResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

const fetchSearchPlayersServerFn = createServerFn({ method: 'GET' })
  .validator((searchQuery = "") => searchQuery)
  .handler(async (ctx) => {
    const searchQuery = ctx.data as string;
    try {
      console.info("Fetching players from:", `${API_BASE_URL}/search-players`, "Query:", searchQuery);

      const response = await axios.get(`${API_BASE_URL}/search-players`, {
        params: { q: searchQuery }
      });

      const parsed = APISearchPlayersResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;

    } catch (error: unknown) {
      console.error("Players fetch failed:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch players";

      throw new Error(message);
    }
  });

const fetchSearchPlayers = async ({ queryKey }: { queryKey: readonly [string, string] }) => {
  const [, searchQuery] = queryKey;
  return fetchSearchPlayersServerFn({ data: searchQuery });
};

export function searchPlayersQueryOptions(searchQuery = "") {
  return queryOptions({
    queryKey: ["search-players", searchQuery],
    queryFn: fetchSearchPlayers,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      if (error.message.includes("Invalid API")) return false;
      return failureCount < 2;
    }
  });
}

export const prefetchSearchPlayers = async (queryClient: QueryClient, searchQuery = "") => {
  await queryClient.prefetchQuery(searchPlayersQueryOptions(searchQuery));
};
