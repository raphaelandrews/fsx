import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import type { NewsBySlugResponse } from "./schema";

interface NewsQueriesConfig {
  deployUrl: string;
}

export function createNewsQueries(config: NewsQueriesConfig) {
  const fetchNewsBySlug = createServerFn({ method: "GET" })
    .validator((slug: number) => slug)
    .handler(async ({ data: slug }: { data: number }) => {
      console.info(`Fetching news with slug ${slug}...`);
      return axios
        .get<NewsBySlugResponse>(`${config.deployUrl}/api/news/${slug}`)
        .then((r) => r.data)
        .catch((err) => {
          console.error(`Error fetching news ${slug}:`, err);
          throw new Error(`Failed to fetch news ${slug}`);
        });
    });

  function newsBySlugQueryOptions(slug: number) {
    return queryOptions({
      queryKey: ["news", { slug }],
      queryFn: () => fetchNewsBySlug({ data: slug }),
    });
  }

  return {
    newsBySlugQueryOptions,
  };
}
