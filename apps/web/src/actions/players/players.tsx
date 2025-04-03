import axios from "redaxios";

import type { SearchPlayersType } from "@/types";

export class PlayerNotFoundError extends Error {}

export const fetchSearchPlayers = async () => {
  console.info("Fetching players...");
  return axios
    .get<Array<SearchPlayersType>>("http://localhost:3000/api/players/search-players")
    .then((r) => r.data);
};