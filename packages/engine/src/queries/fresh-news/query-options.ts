import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import type { FreshNewsResponse } from "./schema";

interface FreshNewsQueriesConfig {
  deployUrl: string;
}

export function createFreshNewsQueries(config: FreshNewsQueriesConfig) {
  const fetchFreshNews = createServerFn({ method: "GET" })
    .handler(async () => {
      console.info("Fetching fresh news...");
      return axios
        .get<Array<FreshNewsResponse>>(`${config.deployUrl}/fresh-news`)
        .then((r) => r.data)
        .catch((err) => {
          console.error("Error fetching fresh news:", err);
          throw new Error("Failed to fetch fresh news");
        });
    });

  function freshNewsQueryOptions() {
    return queryOptions({
      queryKey: ["fresh-news"],
      queryFn: () => fetchFreshNews(),
    });
  }

  return {
    freshNewsQueryOptions,
  };
}
