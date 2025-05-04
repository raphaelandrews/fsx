import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import axios from 'redaxios';

import { APIPlayersResponseSchema } from './schema';
import { API_BASE_URL } from "~/lib/utils";

interface PlayersQueriesConfig {
  apiUrl: string;
  defaultItemsPerPage?: number;
}

export interface PlayersFilters {
  page?: number;
  limit?: number;
  sortBy?: 'rapid' | 'blitz' | 'classic';
  sex?: boolean | null;
  titles?: string[];
  clubs?: string[];
  groups?: string[];
  locations?: string[];
}

const fetchPlayersServerFn = createServerFn({ method: 'GET' })
  .validator((filters: PlayersFilters) => filters)
  .handler(async ({ data: filters }: { data: PlayersFilters }) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'rapid',
      sex,
      titles = [],
      clubs = [],
      groups = [],
      locations = []
    } = filters;

    console.info(`Fetching players page ${page} sorted by ${sortBy} with filters:`, filters);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);

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

      const resp = await axios.get(`${API_BASE_URL}/players?${params.toString()}`);
      const parsed = APIPlayersResponseSchema.safeParse(resp.data);

      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error);
        throw new Error('Invalid API response format');
      }

      if (!parsed.data.success) {
        throw new Error(parsed.data.error.message);
      }

      return parsed.data.data;
    } catch (error: unknown) {
      console.error('Error fetching players:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch players';
      throw new Error(message);
    }
  });

const fetchPlayers = async ({ queryKey }: { queryKey: readonly [string, PlayersFilters] }) => {
  const [, filters] = queryKey;
  return fetchPlayersServerFn({ data: filters });
};

export function playersQueryOptions(filters: PlayersFilters = {}) {
  return queryOptions({
    queryKey: ['players', filters] as const,
    queryFn: fetchPlayers,
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
