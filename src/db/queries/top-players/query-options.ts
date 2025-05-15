import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APITopPlayersResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

const fetchTopPlayersServerFn = createServerFn({ method: 'GET' })
  .validator(() => undefined)
  .handler(async () => {
    console.info("Fetching top players from:", API_BASE_URL);

    try {
      const response = await axios.get(`${API_BASE_URL}/top-players`);
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
      const message = error instanceof Error ? error.message : "Failed to fetch players";
      throw new Error(message);
    }
  });

const fetchTopPlayers = async () => {
  return fetchTopPlayersServerFn({});
};

export function topPlayersQueryOptions() {
  return queryOptions({
    queryKey: ["top-players"],
    queryFn: fetchTopPlayers,
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

