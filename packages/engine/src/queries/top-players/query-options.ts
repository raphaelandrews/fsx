import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import type { TopPlayer } from "./schema";

interface TopPlayersQueriesConfig {
  deployUrl: string;
  defaultStaleTime?: number;
  defaultGcTime?: number;
}

export function createTopPlayersQueries(config: TopPlayersQueriesConfig) {
  const fetchTopPlayers = createServerFn({ method: "GET" })
    .validator(() => undefined)
    .handler(async () => {
      try {
        const res = await axios.get<Array<TopPlayer>>(`${config.deployUrl}/api/top-players`);
        return res.data;
      } catch (err: unknown) {
        console.error("Error fetching top players:", err);
        throw new Error("Failed to fetch top players");
      }
    });

  function topPlayersQueryOptions() {
    return queryOptions({
      queryKey: ["top-players"],
      queryFn: () => fetchTopPlayers({}),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: config.defaultStaleTime ?? 1 * 60 * 1000,
      gcTime: config.defaultGcTime ?? 5 * 60 * 1000,
    });
  }

  return {
    topPlayersQueryOptions,
  };
}
