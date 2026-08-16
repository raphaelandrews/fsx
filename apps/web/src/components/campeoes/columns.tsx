import type { ColumnDef } from "@tanstack/react-table"

import { PlayerActions } from "./actions"

export interface ChampionPodiumPlayer {
  id: number
  name: string
  nickname: string | null
  imageUrl: string | null
  location: { name: string }
  playersToTitles: Array<{
    title: { shortTitle: string; type: string }
  }>
}

export interface ChampionTournament {
  name: string
  date: string | null
  tournamentPodiums: Array<{
    place: number
    player: ChampionPodiumPlayer
  }>
}

export const championColumns: ColumnDef<ChampionTournament>[] = [
  {
    accessorKey: "date",
    header: "Ano",
    cell: ({ row }) => {
      const date = row.original.date
      return <div className="tabular-nums">{date ? date.slice(0, 4) : "-"}</div>
    },
  },
  {
    id: "champion",
    header: "Campeão",
    cell: ({ row }) => {
      const podiums = row.original.tournamentPodiums
      const champion = podiums?.[0]?.player
      const championTeam = podiums?.[1]?.player

      if (podiums?.[3]?.player) {
        return (
          <div className="flex items-center gap-3">
            <PlayerActions
              id={champion.id}
              image={champion.imageUrl}
              name={champion.name}
              nickname={champion.nickname}
              shortTitle={champion.playersToTitles?.[0]?.title.shortTitle}
            />
            <PlayerActions
              id={championTeam.id}
              image={championTeam.imageUrl}
              name={championTeam.name}
              nickname={championTeam.nickname}
              shortTitle={championTeam.playersToTitles?.[0]?.title.shortTitle}
            />
          </div>
        )
      }
      return (
        <>
          {champion && (
            <PlayerActions
              id={champion.id}
              image={champion.imageUrl}
              name={champion.name}
              nickname={champion.nickname}
              shortTitle={champion.playersToTitles?.[0]?.title.shortTitle}
            />
          )}
        </>
      )
    },
  },
  {
    id: "runner-up",
    header: "Vice",
    cell: ({ row }) => {
      const podiums = row.original.tournamentPodiums
      const runnerUp = podiums?.[1]?.player
      const runnerUpTeam = podiums?.[2]?.player
      const teamRunnerUp = podiums?.[3]?.player

      if (teamRunnerUp) {
        return (
          <div className="flex items-center gap-3">
            <PlayerActions
              id={teamRunnerUp.id}
              image={teamRunnerUp.imageUrl}
              name={teamRunnerUp.name}
              nickname={teamRunnerUp.nickname}
              shortTitle={teamRunnerUp.playersToTitles?.[0]?.title.shortTitle}
            />
            {runnerUpTeam && (
              <PlayerActions
                id={runnerUpTeam.id}
                image={runnerUpTeam.imageUrl}
                name={runnerUpTeam.name}
                nickname={runnerUpTeam.nickname}
                shortTitle={runnerUpTeam.playersToTitles?.[0]?.title.shortTitle}
              />
            )}
          </div>
        )
      }
      return (
        <>
          {runnerUp && (
            <PlayerActions
              id={runnerUp.id}
              image={runnerUp.imageUrl}
              name={runnerUp.name}
              nickname={runnerUp.nickname}
              shortTitle={runnerUp.playersToTitles?.[0]?.title.shortTitle}
            />
          )}
          {!runnerUp && <p>-</p>}
        </>
      )
    },
  },
]
