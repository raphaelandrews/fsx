"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Actions } from "./actions";
import type { Tournament } from "@/db/queries";

export const columns: ColumnDef<Tournament>[] = [
  {
    accessorKey: "date",
    header: "Ano",
    cell: ({ row }) => {
      const date = row.original.date ? new Date(row.original.date) : null;
      return <div>{date?.toISOString().slice(0, 4) ?? "-"}</div>;
    },
  },
  {
    accessorKey: "champions",
    header: "Campeão",
    cell: ({ row }) => {
      const podiums = row.original.tournamentPodiums;
      const champion = podiums?.[0]?.player;
      const championTeam = podiums?.[1]?.player;

      if (podiums?.[3]?.player) {
        return (
          <div className="flex items-center gap-3">
            <Actions
              id={champion.id}
              name={champion.name}
              nickname={champion.nickname}
              image={champion.imageUrl}
              shortTitle={champion.playersToTitles?.[0]?.title.shortTitle}
            />
            <Actions
              id={championTeam.id}
              name={championTeam.name}
              nickname={championTeam.nickname}
              image={championTeam.imageUrl}
              shortTitle={championTeam.playersToTitles?.[0]?.title.shortTitle}
            />
          </div>
        );
      }
      return (
        <>
          {champion && (
            <Actions
              id={champion.id}
              name={champion.name}
              nickname={champion.nickname}
              image={champion.imageUrl}
              shortTitle={champion.playersToTitles?.[0]?.title.shortTitle}
            />
          )}
        </>
      );
    },
  },
  {
    accessorKey: "runner-up",
    header: "Vice",
    cell: ({ row }) => {
      const podiums = row.original.tournamentPodiums;
      const runnerUp = podiums?.[1]?.player;
      const runnerUpTeam = podiums?.[2]?.player;
      const teamRunnerUp = podiums?.[3]?.player;

      if (teamRunnerUp) {
        return (
          <div className="flex items-center gap-3">
            <Actions
              id={teamRunnerUp.id}
              name={teamRunnerUp.name}
              nickname={teamRunnerUp.nickname}
              image={teamRunnerUp.imageUrl}
              shortTitle={teamRunnerUp.playersToTitles?.[0]?.title.shortTitle}
            />
            {runnerUpTeam && (
              <Actions
                id={runnerUpTeam.id}
                name={runnerUpTeam.name}
                nickname={runnerUpTeam.nickname}
                image={runnerUpTeam.imageUrl}
                shortTitle={runnerUpTeam.playersToTitles?.[0]?.title.shortTitle}
              />
            )}
          </div>
        );
      }
      return (
        <>
          {runnerUp && (
            <Actions
              id={runnerUp.id}
              name={runnerUp.name}
              nickname={runnerUp.nickname}
              image={runnerUp.imageUrl}
              shortTitle={runnerUp.playersToTitles?.[0]?.title.shortTitle}
            />
          )}
          {!runnerUp && <p>-</p>}
        </>
      );
    },
  },
];
