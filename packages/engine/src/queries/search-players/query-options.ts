import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APISearchPlayersResponseSchema } from "./schema";

interface SearchPlayersQueriesConfig {
  apiUrl: string;
}

export function createSearchPlayersQueries(config: SearchPlayersQueriesConfig) {
  const fetchSearchPlayers = (async () => {
    try {
      console.info("Fetching players from:", config.apiUrl);

      const response = await axios.get(`${config.apiUrl}/search-players`);
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
      const message = error instanceof Error ? error.message : "Failed to fetch playres";

      throw new Error(message);
    }
  });

  function searchPlayersQueryOptions() {
    return queryOptions({
      queryKey: ["search-players"],
      queryFn: () => fetchSearchPlayers(),
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

  return {
    searchPlayersQueryOptions,
    searchPlayersQueryKey: () => ["search-players"]
  };
}
