import { queryOptions } from "@tanstack/react-query";

import { fetchPlayer, fetchSearchPlayers, fetchTopPlayers } from "./players";

export const searchPlayersQueryOptions = queryOptions({
  queryKey: ["search-players"],
  queryFn: () => fetchSearchPlayers(),
});

export const playerQueryOptions = (playerId: number) =>
  queryOptions({
    queryKey: ["players", { playerId }],
    queryFn: () => fetchPlayer(playerId),
  });

export const topPlayersQueryOptions = queryOptions({
  queryKey: ["top-players"],
  queryFn: () => fetchTopPlayers(),
});
