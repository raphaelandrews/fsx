import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APIChampionsResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

export const fetchChampions = createServerFn({ method: 'GET' })
  .handler(async () => {
    console.info(`Fetching champions... @${API_BASE_URL}/champions`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/champions`);
      const parsed = APIChampionsResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error("Error fetching champions:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch champions";
      throw new Error(message);
    }
  });

export const championsQueryOptions = () =>
  queryOptions({
    queryKey: ["champions"],
    queryFn: () => fetchChampions(),
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
