import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APINewsBySlugResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

export const fetchNewsBySlug = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }: { data: string }) => {
    console.info(`Fetching news slug=${slug} from`, API_BASE_URL);

    try {
      const response = await axios.get(`${API_BASE_URL}/news/${slug}`);
      const parsed = APINewsBySlugResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error(`Error fetching news ${slug}:`, error);
      const message = error instanceof Error ? error.message : `Failed to fetch news ${slug}`;
      throw new Error(message);
    }
  });

export const newsBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["news", slug],
    queryFn: () => fetchNewsBySlug({ data: slug }),
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
