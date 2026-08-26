import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";

export type Circuit = inferRouterOutputs<AppRouter>["circuits"]["list"][number];
export type CircuitPhase = Circuit["circuitPhases"][number];
export type CircuitPodium = CircuitPhase["circuitPodiums"][number];
export type CircuitPlayer = CircuitPodium["player"];

export type CircuitType = Circuit["type"];

export interface PlayerRow {
  id: number;
  name: string;
  nickname: string | null;
  imageUrl: string | null;
  playersToTitles: CircuitPlayer["playersToTitles"];
  club: CircuitPlayer["club"];
  categories: string[];
  total: number;
  pointsByPhase: Record<string, number>;
}

export interface ClubRow {
  clubId: number | null;
  clubName: string;
  clubLogo: string | null;
  total: number;
  pointsByPhase: Record<string, number>;
  players: PlayerRow[];
}
