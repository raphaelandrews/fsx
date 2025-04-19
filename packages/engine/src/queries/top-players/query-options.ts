import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APITopPlayersResponseSchema } from "./schema";

interface TopPlayersQueriesConfig {
  apiUrl: string;
}

export function createTopPlayersQueries(config: TopPlayersQueriesConfig) {
  const fetchTopPlayers = (async () => {
      console.info("Fetching top players from:", config.apiUrl);

      try {
        const response = await axios.get(`${config.apiUrl}/top-players`);
        const parsed = APITopPlayersResponseSchema.safeParse(response.data);

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

  function topPlayersQueryOptions() {
    return queryOptions({
      queryKey: ["top-players"],
      queryFn: () => fetchTopPlayers(),
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
    topPlayersQueryOptions,
    topPlayersQueryKey: () => ["top-players"]
  };
}