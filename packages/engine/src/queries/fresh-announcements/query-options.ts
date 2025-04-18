import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import type { FreshAnnouncementsResponse } from "./schema";

interface FreshAnnouncementQueriesConfig {
  apiUrl: string;
}

export function createFreshAnnouncementQueries(config: FreshAnnouncementQueriesConfig) {
  const fetchFreshAnnouncements = createServerFn({ method: "GET" })
    .handler(async () => {
      console.info("Fetching fresh announcements...");
      return axios
        .get<Array<FreshAnnouncementsResponse>>(`${config.apiUrl}/fresh-announcements`)
        .then((r) => r.data)
        .catch((err) => {
          console.error("Error fetching fresh announcements:", err);
          throw new Error("Failed to fetch fresh announcements");
        });
    });

  function freshAnnouncementsQueryOptions() {
    return queryOptions({
      queryKey: ["fresh-announcement"],
      queryFn: () => fetchFreshAnnouncements(),
    });
  }

  return {
    freshAnnouncementsQueryOptions,
  };
}
