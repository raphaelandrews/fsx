import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APINewsBySlugResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

const fetchNewsBySlug = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }: { data: string }) => {
    try {
      console.info(`Fetching news slug=${slug} from`, API_BASE_URL);

      const resp = await axios.get(`${API_BASE_URL}/news/${slug}`);
      const parsed = APINewsBySlugResponseSchema.safeParse(resp.data);

      if (!parsed.success) {
        console.error("Schema validation failed:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;

    } catch (err: unknown) {
      console.error(`Error fetching news ${slug}:`, err);
      const message = err instanceof Error ? err.message : `Failed to fetch news ${slug}`;

      throw new Error(message);
    }
  });

export function newsBySlugQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["news", slug],
    queryFn: () => fetchNewsBySlug({ data: slug }),
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
