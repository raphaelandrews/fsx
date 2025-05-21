import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APISearchPlayersResponseSchema, type SearchPlayer } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

export const fetchSearchPlayers = createServerFn({ method: 'GET' })
  .validator((searchQuery = "") => searchQuery)
  .handler(async (ctx) => {
    const searchQuery = ctx.data;
    console.info(`Searching players by query=${searchQuery}... @${API_BASE_URL}/search-players`);
    
    try {
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
      console.error("Error fetching players:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch players";
      throw new Error(message);
    }
  });

export const searchPlayersQueryOptions = (searchQuery = "") =>
  queryOptions({
    queryKey: ["search-players", searchQuery],
    queryFn: () => fetchSearchPlayers({ data: searchQuery }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 60 * 24 * 30,
    gcTime: 1000 * 60 * 60 * 24 * 30,
    retry: (failureCount, error: Error) => {
      if (error.message.includes("Invalid API")) return false;
      return failureCount < 2;
    }
  });
