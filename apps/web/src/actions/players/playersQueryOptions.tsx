import { queryOptions } from '@tanstack/react-query'

import { fetchSearchPlayers } from './players'

export const playerQueryOptions = queryOptions({
  queryKey: ['search-players'],
  queryFn: () => fetchSearchPlayers(),
})
