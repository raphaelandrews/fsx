import { SheetContent } from "@fsx/ui/components/sheet"
import { Skeleton } from "@fsx/ui/components/skeleton"
import { PlayerProfile } from "@/components/player/player-profile"
import type { PlayerById as PlayerByIdType } from "@/components/player/player-profile"
import type { ClubStanding, PlayerAnnouncement, PlayerCircuitSeason, PlayerRanking, PlayerStatsResult } from "@/components/player/types"

export const PlayerSheet = ({
  player,
  stats,
  circuitSeasons,
  announcements,
  ranking,
  clubStanding = null,
  isLoading,
  isError,
  error,
}: {
  player?: PlayerByIdType | null
  stats?: PlayerStatsResult
  circuitSeasons?: PlayerCircuitSeason[]
  announcements?: PlayerAnnouncement[]
  ranking?: PlayerRanking
  clubStanding?: ClubStanding | null
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
}) => {
  if (isLoading) {
    return (
      <SheetContent className="!w-[400px] sm:!w-[540px] !max-w-[90%] sm:!max-w-[480px] gap-0 overflow-y-auto overflow-x-hidden p-4 [&>button#close-sheet]:top-2.5 [&>button#close-sheet]:right-2.5">
        <div className="flex h-full flex-col items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <div className="flex w-full flex-col items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </SheetContent>
    )
  }

  if (isError) {
    return (
      <SheetContent className="gap-0 overflow-y-auto overflow-x-hidden [&>button#close-sheet]:top-1 [&>button#close-sheet]:right-1">
        <div className="flex h-full flex-col items-center justify-center text-destructive">
          <p>
            Error loading player data: {error?.message || "Unknown error"}
          </p>
        </div>
      </SheetContent>
    )
  }

  if (!player || !stats || !circuitSeasons || !announcements || !ranking) {
    return null
  }

  return (
    <SheetContent className="!w-[400px] sm:!w-[540px] !max-w-[90%] sm:!max-w-[600px] gap-0 overflow-y-auto overflow-x-hidden p-0 [&>button#close-sheet]:top-2.5 [&>button#close-sheet]:right-2.5 border-l-0">
      <PlayerProfile player={player} stats={stats} circuitSeasons={circuitSeasons} announcements={announcements} ranking={ranking} clubStanding={clubStanding} />
    </SheetContent>
  )
}
