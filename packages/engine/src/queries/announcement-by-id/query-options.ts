import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APIAnnouncementByIdResponseSchema } from "./schema";

interface AnnouncementQueriesConfig {
  apiUrl: string;
}

export function createAnnouncementQueries(config: AnnouncementQueriesConfig) {
  const fetchAnnouncementById = createServerFn({ method: "GET" })
    .validator((id: number) => id)
    .handler(async ({ data: id }: { data: number }) => {
      try {
        console.info(`Fetching announcement id=${id} from:`, config.apiUrl);

        const resp = await axios.get(`${config.apiUrl}/announcement/${id}`);
        const parsed = APIAnnouncementByIdResponseSchema.safeParse(resp.data);

        if (!parsed.success) {
          console.error("Validation error:", parsed.error);
          throw new Error("Invalid API response format");
        }

        if (!parsed.data.success) {
          throw new Error(parsed.data.error.message);
        }

        return parsed.data.data;

      } catch (err: unknown) {
        console.error(`Error fetching announcement ${id}:`, err);
        const message = err instanceof Error ? err.message : `Failed to fetch announcement ${id}`;
        
        throw new Error(message);
      }
    });

  function announcementByIdQueryOptions(id: number) {
    return queryOptions({
      queryKey: ["announcement", { id }],
      queryFn: () => fetchAnnouncementById({ data: id }),
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error.message.includes("Invalid API")) return false;
        return failureCount < 3;
      }
    });
  }

  return {
    announcementByIdQueryOptions,
    announcementByIdQueryKey: (id: number) => ["announcement", { id }],
  };
}
