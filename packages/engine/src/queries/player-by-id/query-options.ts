import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APIPlayerByIdResponseSchema } from "./schema";

interface PlayerQueriesConfig {
  apiUrl: string;
}

export function createPlayerQueries(config: PlayerQueriesConfig) {
  const fetchPlayerById = (async ({ data: id }: { data: number }) => {
    try {
      console.info(`Fetching player ${id} from: ${config.apiUrl}`);

      const response = await axios.get(`${config.apiUrl}/player/${id}`);
      const parsed = APIPlayerByIdResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (err: unknown) {
      console.error(`Error fetching player ${id}:`, err);
      const message = err instanceof Error ? err.message : `Failed to fetch player ${id}`;

      throw new Error(message);
    }
  });

  function playerByIdQueryOptions(id: number) {
    return queryOptions({
      queryKey: ["player", { id }],
      queryFn: () => fetchPlayerById({ data: id }),
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
    playerByIdQueryOptions,
    playerByIdQueryKey: (id: number) => ["player", { id }],
  };
}
