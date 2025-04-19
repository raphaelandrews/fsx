import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APIFreshNewsResponseSchema } from "./schema";

interface FreshNewsQueriesConfig {
  apiUrl: string;
}

export function createFreshNewsQueries(config: FreshNewsQueriesConfig) {
  const fetchFreshNews = (async () => {
    try {
      console.info("Fetching fresh news from:", `${config.apiUrl}/fresh-news`);

      const response = await axios.get(`${config.apiUrl}/fresh-news`);
      const parsed = APIFreshNewsResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;

    } catch (error: unknown) {
      console.error("Fresh news fetch failed:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch fresh news";

      throw new Error(message);
    }
  });

  function freshNewsQueryOptions() {
    return queryOptions({
      queryKey: ["fresh-news"],
      queryFn: () => fetchFreshNews(),
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
    freshNewsQueryOptions,
    freshNewsQueryKey: () => ["fresh-news"]
  };
}