import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";

type Outputs = inferRouterOutputs<AppRouter>;

export type PlayerStatsResult = Outputs["players"]["stats"];
export type PlayerCircuitSeason = Outputs["players"]["circuitSeasons"][number];
export type PlayerAnnouncement = Outputs["announcements"]["byPlayer"][number];
export type PlayerRanking = Outputs["players"]["ranking"];
export type ClubStanding = Outputs["clubs"]["leaderboard"][number];
