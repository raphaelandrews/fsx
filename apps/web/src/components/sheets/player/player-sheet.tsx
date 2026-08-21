import { Sheet, SheetContent } from "@fsx/ui/components/sheet"
import { Skeleton } from "@fsx/ui/components/skeleton"
import { PlayerProfile } from "@/components/player/player-profile"
import type { PlayerById as PlayerByIdType } from "@/components/player/player-profile"

export const PlayerSheet = ({
  open,
  setOpen,
  player,
  isLoading,
  isError,
  error,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  player?: PlayerByIdType | null
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  id?: number
}) => {
  if (isLoading) {
    return (
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="!w-[400px] sm:!w-[540px] !max-w-[90%] sm:!max-w-[480px] gap-0 overflow-y-auto overflow-x-hidden p-4 [&>button#close-sheet]:top-2.5 [&>button#close-sheet]:right-2.5">
          <div className="flex h-full flex-col items-center justify-center">
            <Skeleton className="mb-4 h-20 w-20 rounded-full" />
            <Skeleton className="mb-2 h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (isError) {
    return (
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="gap-0 overflow-y-auto overflow-x-hidden [&>button#close-sheet]:top-1 [&>button#close-sheet]:right-1">
          <div className="flex h-full flex-col items-center justify-center text-red-500">
            <p>
              Error loading player data: {error?.message || "Unknown error"}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!player) {
    return null
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetContent className="!w-[400px] sm:!w-[540px] !max-w-[90%] sm:!max-w-[600px] gap-0 overflow-y-auto overflow-x-hidden p-0 [&>button#close-sheet]:top-2.5 [&>button#close-sheet]:right-2.5 border-l-0">
        <PlayerProfile player={player} />
      </SheetContent>
    </Sheet>
  )
}
