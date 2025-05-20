import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import axios from 'redaxios';

import { APINewsByPageResponseSchema } from './schema';
import { API_BASE_URL } from "~/lib/utils";

export const fetchNewsByPage = createServerFn({ method: 'GET' })
  .validator((page: number) => page)
  .handler(async (ctx) => {
    const page = ctx.data;
    console.info(`Fetching news page ${page} from ${API_BASE_URL}`);

    try {
      const response = await axios.get(`${API_BASE_URL}/news?page=${page}`);
      const parsed = APINewsByPageResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error(`Error fetching news page ${page}:`, error);
      const message = error instanceof Error ? error.message : `Failed to fetch news page ${page}`;
      throw new Error(message);
    }
  });

export const newsByPageQueryOptions = (page = 1) =>
  queryOptions({
    queryKey: ['news', page] as const,
    queryFn: () => fetchNewsByPage({ data: page }),
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