import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"

import { PlayerSheetButton } from "@/components/player/player-sheet-button"

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
  id: number
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
      return (
        <Link
          to="/torneios/$id"
          params={{ id: row.original.id }}
          aria-label={`${row.original.name}${date ? ` (${date.slice(0, 4)})` : ""}`}
          className="tabular-nums underline-offset-4 hover:underline"
        >
          {date ? date.slice(0, 4) : "Ver"}
        </Link>
      )
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
            <PlayerSheetButton
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
            <PlayerSheetButton
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
