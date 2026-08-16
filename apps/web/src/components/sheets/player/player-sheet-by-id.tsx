import { useQuery } from "@tanstack/react-query"

import { useTRPC } from "@/utils/trpc"
import { PlayerSheet } from "./player-sheet"

export function PlayerSheetById({
  id,
  open,
  setOpen,
}: {
  id: number
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const { data: player, isLoading, isError, error } = useQuery({
    ...trpc.players.byId.queryOptions({ id }),
    enabled: open,
  })

  return (
    <PlayerSheet
      error={error ? new Error(error.message) : null}
      isError={isError}
      isLoading={isLoading && open}
      open={open}
      player={player}
      setOpen={setOpen}
    />
  )
}
