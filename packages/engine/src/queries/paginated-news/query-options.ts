import { type QueryFunctionContext, queryOptions } from '@tanstack/react-query';
import axios from 'redaxios';

import type { News, NewsPagination } from './schema';
import { APINewsResponseSchema } from './schema';

interface NewsQueriesConfig {
  apiUrl: string;
  defaultItemsPerPage?: number;
}

export function createNewsQueries(config: NewsQueriesConfig) {
  const fetchNews = async (
    ctx: QueryFunctionContext<[string, number]>
  ): Promise<{ news: News[]; pagination: NewsPagination }> => {
    const [, page] = ctx.queryKey;
    console.info(`Fetching news page ${page} from ${config.apiUrl}`);

    try {
      const resp = await axios.get(`${config.apiUrl}/news?page=${page}`);
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
  };

  function newsQueryOptions(page = 1) {
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

  return { fetchNews, newsQueryOptions };
}
