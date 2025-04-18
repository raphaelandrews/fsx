import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import type { SearchPlayerResponse } from "./schema";

interface SearchPlayersQueriesConfig {
  apiUrl: string;
  defaultStaleTime?: number;
  defaultGcTime?: number;
}

export function createSearchPlayersQueries(config: SearchPlayersQueriesConfig) {
  const fetchSearchPlayers = createServerFn({ method: "GET" })
    .validator(() => undefined)
    .handler(async () => {
      try {
        const res = await axios.get<Array<SearchPlayerResponse>>(
          `${config.apiUrl}/api/search-players`
        );
        return res.data;
      } catch (err: unknown) {
        console.error("Error fetching search players:", err);
        throw new Error("Failed to fetch players");
      }
    });

  function searchPlayersQueryOptions() {
    return queryOptions({
      queryKey: ["search-players"],
      queryFn: () => fetchSearchPlayers({}),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: config.defaultStaleTime ?? 1 * 60 * 1000,
      gcTime: config.defaultGcTime ?? 5 * 60 * 1000,
    });
  }

  return {
    searchPlayersQueryOptions,
  };
}
