import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import type { AnnouncementByIdResponse } from "./schema";

interface AnnouncementQueriesConfig {
  deployUrl: string;
}

export function createAnnouncementQueries(config: AnnouncementQueriesConfig) {
  const fetchAnnouncementById = createServerFn({ method: "GET" })
    .validator((id: number) => id)
    .handler(async ({ data: id }: { data: number }) => {
      console.info(`Fetching announcement with id ${id}...`);
      return axios
        .get<Array<AnnouncementByIdResponse>>(`${config.deployUrl}/api/announcement/${id}`)
        .then((r) => r.data)
        .catch((err) => {
          console.error(`Error fetching announcement ${id}:`, err);
          throw new Error(`Failed to fetch announcement ${id}`);
        });
    });

  function announcementByIdQueryOptions(id: number) {
    return queryOptions({
      queryKey: ["announcement", { id }],
      queryFn: () => fetchAnnouncementById({ data: id }),
    });
  }

  return {
    announcementByIdQueryOptions,
  };
}
