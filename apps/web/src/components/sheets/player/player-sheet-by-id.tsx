import { useQuery } from "@tanstack/react-query"

import { Sheet, SheetTrigger } from "@fsx/ui/components/sheet"

import { useTRPC } from "@/utils/trpc"
import { getUserErrorMessage } from "@/lib/errors"
import { PlayerSheet } from "./player-sheet"

export function PlayerSheetById({
  id,
  open,
  setOpen,
  trigger,
}: {
  id: number
  open: boolean
  setOpen: (open: boolean) => void
  trigger: React.ReactElement
}) {
  const trpc = useTRPC()
  const player = useQuery({ ...trpc.players.byId.queryOptions({ id }), enabled: open })
  const stats = useQuery({ ...trpc.players.stats.queryOptions({ id }), enabled: open })
  const circuitSeasons = useQuery({ ...trpc.players.circuitSeasons.queryOptions({ id }), enabled: open })
  const announcements = useQuery({ ...trpc.announcements.byPlayer.queryOptions({ playerId: id }), enabled: open })
  const ranking = useQuery({ ...trpc.players.ranking.queryOptions({ id }), enabled: open })
  const clubs = useQuery({ ...trpc.clubs.leaderboard.queryOptions(), enabled: open })
  const queries = [player, stats, circuitSeasons, announcements, ranking, clubs]
  const error = queries.find((query) => query.error)?.error

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger render={trigger} />
      <PlayerSheet
        error={error ? new Error(getUserErrorMessage(error, "Não foi possível carregar o jogador.")) : null}
        isError={queries.some((query) => query.isError)}
        isLoading={queries.some((query) => query.isLoading) && open}
        player={player.data}
        stats={stats.data}
        circuitSeasons={circuitSeasons.data}
        announcements={announcements.data}
        ranking={ranking.data}
        clubStanding={clubs.data?.find((standing) => standing.club.id === player.data?.club?.id) ?? null}
      />
    </Sheet>
  )
}
