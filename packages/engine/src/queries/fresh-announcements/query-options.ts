import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APIFreshAnnouncementsResponseSchema } from "./schema";

interface FreshAnnouncementQueriesConfig {
  apiUrl: string;
}

export function createFreshAnnouncementQueries(config: FreshAnnouncementQueriesConfig) {
  const fetchFreshAnnouncements = createServerFn({ method: "GET" })
    .handler(async () => {
      try {
        console.info("Fetching fresh announcements from:", config.apiUrl);

        const resp = await axios.get(`${config.apiUrl}/fresh-announcements`);
        const parsed = APIFreshAnnouncementsResponseSchema.safeParse(resp.data);

        if (!parsed.success) {
          console.error("Schema validation failed:", parsed.error);
          throw new Error("Invalid API response format");
        }

        if (!parsed.data.success) {
          throw new Error(parsed.data.error.message);
        }

        return parsed.data.data;
      } catch (error: unknown) {
        console.error("Error fetching fresh announcements:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch fresh announcements";
        
        throw new Error(message);
      }
    });

  function freshAnnouncementsQueryOptions() {
    return queryOptions({
      queryKey: ["fresh-announcements"],
      queryFn: () => fetchFreshAnnouncements(),
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error: Error) => {
        if (error.message.includes("Invalid API")) return false;
        return failureCount < 3;
      }
    });
  }

  return {
    freshAnnouncementsQueryOptions,
    freshAnnouncementsQueryKey: () => ["fresh-announcements"],
  };
}