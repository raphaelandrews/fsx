import axios from "redaxios";

import type { PlayerProfileType, SearchPlayerType, TopPlayerType } from "@/types";

import { API_BASE } from "@/lib/utils";

export class PlayerNotFoundError extends Error {}

export const fetchSearchPlayers = async () => {
  console.info("Fetching players...");
  return axios
    .get<Array<SearchPlayerType>>("http://localhost:3000/api/players/search-players")
    .then((r) => r.data);
};

export const fetchPlayer = async (playerId: number) => {
  console.info(`Fetching player with id ${playerId}...`);
  const player = await axios
    .get<PlayerProfileType>(`http://localhost:3000/api/players/${playerId}`)
    .then((r) => r.data)
    .catch((err) => {
      if (err.status === 404) {
        throw new PlayerNotFoundError(`Post with id "${playerId}" not found!`);
      }
      throw err;
    });

  return player;
};

export const fetchTopPlayers = async () => {
  console.info("Fetching players...");
  return axios
    .get<Array<TopPlayerType>>("http://localhost:3000/api/players/top-players")
    .then((r) => r.data);
}
