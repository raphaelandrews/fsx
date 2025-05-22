import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APITitledPlayersResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

export const fetchTitledPlayers = createServerFn({ method: 'GET' })
  .handler(async () => {
    console.info(`Fetching titled players... @${API_BASE_URL}/titled-players`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/titled-players`);
      const parsed = APITitledPlayersResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error("Error fetching titled players:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch titled players";
      throw new Error(message);
    }
  });

export const titledPlayersQueryOptions = () =>
  queryOptions({
    queryKey: ["titled-players"],
    queryFn: () => fetchTitledPlayers(),
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
