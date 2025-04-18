import { queryOptions } from "@tanstack/react-query";
import axios from "redaxios";

import type { PaginatedPlayersResponse } from "./schema";

interface PlayersQueriesConfig {
  deployUrl: string;
  defaultStaleTime?: number;
  defaultGcTime?: number;
}

export function createPlayersQueries(config: PlayersQueriesConfig) {
  const fetchPaginatedPlayers = async (page = 1, limit = 20) => {
    return axios
      .get<PaginatedPlayersResponse>(`${config.deployUrl}/api/players?page=${page}&limit=${limit}`)
      .then((r) => r.data)
      .catch((err) => {
        if (err.response?.status === 404) {
          return {
            players: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit,
              hasNextPage: false,
              hasPreviousPage: page > 1,
            },
          };
        }
        throw err;
      });
  };

  function playersQueryOptions(page = 1, limit = 20) {
    return queryOptions({
      queryKey: ["paginated-players", page, limit],
      queryFn: () => fetchPaginatedPlayers(page, limit),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: config.defaultStaleTime ?? 1 * 60 * 1000,
      gcTime: config.defaultGcTime ?? 5 * 60 * 1000,
    });
  }

  return {
    playersQueryOptions,
  };
}
