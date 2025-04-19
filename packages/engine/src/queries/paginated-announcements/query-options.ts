import { queryOptions } from '@tanstack/react-query';
import axios from 'redaxios';

import type { SuccessAnnouncementsSchema } from './schema';

interface AnnouncementsQueriesConfig {
  apiUrl: string;
  defaultItemsPerPage?: number;
}

export function createAnnouncementsQueries(config: AnnouncementsQueriesConfig) {
  const fetchPaginatedAnnouncements = async (page = 1) => {
    console.info(`Fetching announcements page ${page}...`);
    return axios
      .get<typeof SuccessAnnouncementsSchema>(
        `${config.apiUrl}/announcements?page=${page}`
      )
      .then((r) => r.data)
      .catch((err) => {
        if (err.response?.status === 404) {
          return {
            announcements: [],
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

  function paginatedAnnouncementsQueryOptions(page = 1) {
    return queryOptions({
      queryKey: ['paginated-announcements', page],
      queryFn: () => fetchPaginatedAnnouncements(page),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  }

  return {
    fetchPaginatedAnnouncements,
    paginatedAnnouncementsQueryOptions,
  };
}