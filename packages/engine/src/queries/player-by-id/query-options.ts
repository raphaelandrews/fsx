import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import type { PlayerByIdResponse } from "./schema";

interface PlayerQueriesConfig {
  apiUrl: string;
}

export function createPlayerQueries(config: PlayerQueriesConfig) {
  const fetchPlayerById = createServerFn({ method: "GET" })
    .validator((d: number) => d)
    .handler(async ({ data: id }: { data: number }) => {
      console.info(`Fetching player with id ${id}...`);
      return axios
        .get<PlayerByIdResponse>(`${config.apiUrl}/api/player/${id}`)
        .then((r) => r.data)
        .catch((err) => {
          console.error(`Error fetching player ${id}:`, err);
          throw new Error(`Failed to fetch player ${id}`);
        });
    });

  function playerByIdQueryOptions(id: number) {
    return queryOptions({
      queryKey: ["player", { id }],
      queryFn: () => fetchPlayerById({ data: id }),
    });
  }

  return {
    playerByIdQueryOptions,
  };
}
