import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { playerByIdQueryOptions } from "@/db/client-queries/player-by-id/query-options"
import { PlayerProfile } from "@/components/player/player-profile"

export const PlayerSheet = ({
	id,
	open,
	setOpen,
}: {
	id: number
	open: boolean
	setOpen: (open: boolean) => void
}) => {
	const {
		data: player,
		isLoading,
		isError,
		error,
	} = useQuery(playerByIdQueryOptions(Number(id)))

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
		);
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
			<SheetContent className="!w-[400px] sm:!w-[540px] !max-w-[90%] sm:!max-w-[600px] gap-0 overflow-y-auto overflow-x-hidden p-0 [&>button#close-sheet]:top-2.5 [&>button#close-sheet]:right-2.5 border-l-0 dotted-line-vertical">
				<PlayerProfile player={player} />
			</SheetContent>
		</Sheet>
	)
}
