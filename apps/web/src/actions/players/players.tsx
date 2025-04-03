import axios from "redaxios";

import type { PlayerProfileType, SearchPlayersType } from "@/types";

export class PlayerNotFoundError extends Error {}

export const fetchSearchPlayers = async () => {
  console.info("Fetching players...");
  return axios
    .get<Array<SearchPlayersType>>("http://localhost:3000/api/players/search-players")
    .then((r) => r.data);
};

export const fetchPlayer = async (playerId: string) => {
  console.info(`Fetching player with id ${playerId}...`);
  const post = await axios
    .get<PlayerProfileType>(`https://jsonplaceholder.typicode.com/posts/${playerId}`)
    .then((r) => r.data)
    .catch((err) => {
      if (err.status === 404) {
        throw new PlayerNotFoundError(`Post with id "${playerId}" not found!`);
      }
      throw err;
    });

  return post;
};