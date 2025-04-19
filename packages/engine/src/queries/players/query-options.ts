import { queryOptions, type QueryFunctionContext } from '@tanstack/react-query';
import axios from 'redaxios';

import type { Player, PlayersPagination } from './schema';
import { APIPlayersResponseSchema } from './schema';

interface PlayersQueriesConfig {
  apiUrl: string;
  defaultItemsPerPage?: number;
}

export function createPlayersQueries(config: PlayersQueriesConfig) {
  const fetchPlayers = async (
    ctx: QueryFunctionContext<[string, number, number]>
  ): Promise<{ players: Player[]; pagination: PlayersPagination }> => {
    const [, page, limit] = ctx.queryKey;
    console.info(`Fetching players page ${page} with limit ${limit} from ${config.apiUrl}`);

    try {
      const resp = await axios.get(`${config.apiUrl}/players?page=${page}&limit=${limit}`)
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
  };

  function playersQueryOptions(page = 1, limit = 20) {
    return queryOptions({
      queryKey: ['players', page, limit] as const,
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

  return { fetchPlayers, playersQueryOptions };
}
