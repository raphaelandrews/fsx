import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APIFreshNewsResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

export const fetchFreshNews = createServerFn({ method: 'GET' })
  .handler(async () => {
    console.info("Fetching fresh news from:", `${API_BASE_URL}/fresh-news`);

    try {
      const response = await axios.get(`${API_BASE_URL}/fresh-news`);
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
      console.error("Error fetching fresh news:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch fresh news";
      throw new Error(message);
    }
  });

export const freshNewsQueryOptions = () =>
  queryOptions({
    queryKey: ["fresh-news"],
    queryFn: () => fetchFreshNews(),
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
