import { queryOptions } from '@tanstack/react-query';
import axios from 'redaxios';

import type { PaginatedNewsResponse } from './schema';

interface NewsQueriesConfig {
  apiUrl: string;
  defaultItemsPerPage?: number;
}

export function createPaginatedNewsQueries(config: NewsQueriesConfig) {
  const fetchPaginatedNews = async (page = 1) => {
    console.info(`Fetching news page ${page}...`);
    return axios
      .get<PaginatedNewsResponse>(`${config.apiUrl}/news?page=${page}`)
      .then((r) => r.data)
      .catch((err) => {
        if (err.response?.status === 404) {
          return {
            news: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: config.defaultItemsPerPage ?? 12,
              hasNextPage: false,
              hasPreviousPage: page > 1,
            },
          };
        }
        throw err;
      });
  };

  function paginatedNewsQueryOptions(page = 1) {
    return queryOptions({
      queryKey: ['paginated-news', page],
      queryFn: () => fetchPaginatedNews(page),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  }

  return {
    fetchPaginatedNews,
    paginatedNewsQueryOptions,
  };
}
