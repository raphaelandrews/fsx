import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import axios from 'redaxios';

import { APINewsResponseSchema } from './schema';
import { API_BASE_URL } from "~/lib/utils";

const fetchNewsServerFn = createServerFn({ method: 'GET' })
  .validator((page: number) => page)
  .handler(async ({ data: page }: { data: number }) => {
    try {
      console.info(`Fetching news page ${page} from ${API_BASE_URL}`);

      const resp = await axios.get(`${API_BASE_URL}/news?page=${page}`);
      const parsed = APINewsResponseSchema.safeParse(resp.data);

      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error);
        throw new Error('Invalid API response format');
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error('Error fetching news:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch news';
      throw new Error(message);
    }
  });


const fetchNews = async ({ queryKey }: { queryKey: readonly [string, number] }) => {
  const [, page] = queryKey;
  return fetchNewsServerFn({ data: page });
};

export function newsQueryOptions(page = 1) {
  return queryOptions({
    queryKey: ['news', page] as const,
    queryFn: fetchNews,
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
