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
  const { data: player, isLoading, isError, error } = useQuery({
    ...trpc.players.byId.queryOptions({ id }),
    enabled: open,
  })

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger render={trigger} />
      <PlayerSheet
        error={error ? new Error(getUserErrorMessage(error, "Não foi possível carregar o jogador.")) : null}
        isError={isError}
        isLoading={isLoading && open}
        player={player}
      />
    </Sheet>
  )
}
