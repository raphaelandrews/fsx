import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import axios from 'redaxios';

import { APIAnnouncementsResponseSchema } from './schema';
import { API_BASE_URL } from "~/lib/utils";

const fetchAnnouncementsServerFn = createServerFn({ method: 'GET' })
  .validator((page: number) => page)
  .handler(async ({ data: page }: { data: number }) => {
    try {
      console.info(`Fetching announcements page ${page} from ${API_BASE_URL}`);

      const resp = await axios.get(`${API_BASE_URL}/announcements?page=${page}`);
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
  });

const fetchAnnouncements = async ({ queryKey }: { queryKey: readonly [string, number] }) => {
  const [, page] = queryKey;
  return fetchAnnouncementsServerFn({ data: page });
};

export function announcementsQueryOptions(page = 1) {
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
