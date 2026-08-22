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
      const podiums = row.original.tournamentPodiums ?? []
      const champions = podiums.filter((p) => p.place === 1).map((p) => p.player)

      if (champions.length === 0) return <p>-</p>

      return (
        <div className="flex items-center gap-3">
          {champions.map((player) => (
            <PlayerActions
              key={player.id}
              id={player.id}
              image={player.imageUrl}
              name={player.name}
              nickname={player.nickname}
              shortTitle={player.playersToTitles?.[0]?.title.shortTitle}
            />
          ))}
        </div>
      )
    },
  },
  {
    id: "runner-up",
    header: "Vice",
    cell: ({ row }) => {
      const podiums = row.original.tournamentPodiums ?? []
      const runnerUps = podiums.filter((p) => p.place === 2).map((p) => p.player)

      if (runnerUps.length === 0) return <p>-</p>

      return (
        <div className="flex items-center gap-3">
          {runnerUps.map((player) => (
            <PlayerActions
              key={player.id}
              id={player.id}
              image={player.imageUrl}
              name={player.name}
              nickname={player.nickname}
              shortTitle={player.playersToTitles?.[0]?.title.shortTitle}
            />
          ))}
        </div>
      )
    },
  },
]
