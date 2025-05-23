import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APITopPlayersResponseSchema, type TopPlayer } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

export const fetchTopPlayers = createServerFn({ method: 'GET' })
  .handler(async () => {
    console.info(`Fetching top players ... @${API_BASE_URL}/top-players`);

    try {
      const response = await axios.get<TopPlayer>(`${API_BASE_URL}/top-players`);
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
      console.error('Error fetching players:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch players';
      throw new Error(message);
    }
  });

export const topPlayersQueryOptions = () =>
  queryOptions({
    queryKey: ["top-players"],
    queryFn: () => fetchTopPlayers(),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 60 * 24 * 15,
    gcTime: 1000 * 60 * 60 * 24 * 15,
    retry: (failureCount, error: Error) => {
      if (error.message.includes("Invalid API")) return false;
      return failureCount < 2;
    }
  });


