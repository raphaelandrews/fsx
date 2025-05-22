import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import axios from "redaxios";

import { APIPostsBySlugResponseSchema } from "./schema";
import { API_BASE_URL } from "~/lib/utils";

export const fetchPostBySlug = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }: { data: string }) => {
    console.info(`Fetching posts by slug=${slug}... @${API_BASE_URL}/posts/${slug}`);

    try {
      const response = await axios.get(`${API_BASE_URL}/posts/${slug}`);
      const parsed = APIPostsBySlugResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error(`Error fetching post ${slug}:`, error);
      const message = error instanceof Error ? error.message : `Failed to fetch post ${slug}`;
      throw new Error(message);
    }
  });

export const postBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: () => fetchPostBySlug({ data: slug }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 60 * 24 * 15,
    gcTime: 1000 * 60 * 60 * 24 * 15,
    retry: (failureCount, error: Error) => {
      if (error.message.includes("Invalid API")) return false;
      return failureCount < 2;
    }
  });
