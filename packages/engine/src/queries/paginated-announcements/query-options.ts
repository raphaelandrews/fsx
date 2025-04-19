import { queryOptions, type QueryFunctionContext } from '@tanstack/react-query';
import axios from 'redaxios';

import type { Announcement, AnnouncementsPagination } from './schema';
import { APIAnnouncementsResponseSchema } from './schema';

interface AnnouncementsQueriesConfig {
  apiUrl: string;
  defaultItemsPerPage?: number;
}

export function createAnnouncementsQueries(config: AnnouncementsQueriesConfig) {
  const fetchAnnouncements = async (
    ctx: QueryFunctionContext<[string, number]>
  ): Promise<{ announcements: Announcement[]; pagination: AnnouncementsPagination }> => {
    const [, page] = ctx.queryKey;
    console.info(`Fetching announcements page ${page} from ${config.apiUrl}`);

    try {
      const resp = await axios.get(`${config.apiUrl}/announcements?page=${page}`);
      const parsed = APIAnnouncementsResponseSchema.safeParse(resp.data);

      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error);
        throw new Error('Invalid API response format');
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error('Error fetching announcements:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch announcements';

      throw new Error(message);
    }
  };

  function announcementsQueryOptions(page = 1) {
    return queryOptions({
      queryKey: ['announcements', page] as const,
      queryFn: fetchAnnouncements,
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

  return { fetchAnnouncements, announcementsQueryOptions };
}
