import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import axios from 'redaxios';

import { APIPlayersWithFiltersResponseSchema } from './schema';
import { API_BASE_URL } from "~/lib/utils";

export interface PlayersFilters {
  page?: number;
  limit?: number;
  sortBy?: 'rapid' | 'blitz' | 'classic';
  name?: string | null;
  sex?: boolean | null;
  titles?: string[];
  clubs?: string[];
  groups?: string[];
  locations?: string[];
}

export const fetchPlayersWithFilters = createServerFn({ method: 'GET' })
  .validator((filters: PlayersFilters) => filters)
  .handler(async (ctx) => {
    const filters = ctx.data;
    const {
      page = 1,
      limit = 20,
      sortBy = 'rapid',
      name,
      sex,
      titles = [],
      clubs = [],
      groups = [],
      locations = []
    } = filters;

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', sortBy);

    console.info(`Fetching players by page=${page}, sorted by sortBy=${sortBy} with filters=${filters}:... @${API_BASE_URL}/players?${params.toString()}`);

    try {
      if (name !== undefined && name !== null) {
        params.append('name', name.toString());
      }
      if (sex !== undefined && sex !== null) {
        params.append('sex', sex.toString());
      }

      for (const title of titles) {
        params.append('title', title);
      }

      for (const club of clubs) {
        params.append('club', club);
      }

      for (const group of groups) {
        params.append('group', group);
      }

      for (const locationId of locations) {
        params.append('location', locationId.toString());
      }

      const response = await axios.get(`${API_BASE_URL}/players?${params.toString()}`);
      const parsed = APIPlayersWithFiltersResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        throw new Error("Invalid API response format");
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error(`Error fetching players with filters ${filters}:`, error);
      const message = error instanceof Error ? error.message : `Failed to fetch players with filters ${filters}`;
      throw new Error(message);
    }
  });

export const playersWithFiltersQueryOptions = (filters: PlayersFilters = {}) =>
  queryOptions({
    queryKey: ['players', filters] as const,
    queryFn: () => fetchPlayersWithFilters({ data: filters }),
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
