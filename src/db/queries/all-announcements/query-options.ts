import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import axios from 'redaxios';

import { APIAllAnnouncementsResponseSchema } from './schema';
import { API_BASE_URL } from "~/lib/utils";

export const fetchAllAnnouncements = createServerFn({ method: 'GET' })
  .handler(async () => {
    console.info(`Fetching announcements... @${API_BASE_URL}/all-announcements`);

    try {
      const response = await axios.get(`${API_BASE_URL}/all-announcements`);
      const parsed = APIAllAnnouncementsResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error("Error fetching announcements:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch announcements";
      throw new Error(message);
    }
  });

export const allAnnouncementsByPageQueryOptions = () =>
  queryOptions({
    queryKey: ['announcements'],
    queryFn: () => fetchAllAnnouncements(),
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
