import React from "react"

import { getGradient } from "@/lib/generate-gradients"
import { formatDefendingChampions } from "@/lib/defending-champions"

import dynamic from "next/dynamic"

const PlayerSheet = dynamic(
	() =>
		import("@/components/sheets/player/player-sheet").then(
			(mod) => mod.PlayerSheet
		),
	{ ssr: false }
)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Props {
	id: number
	name: string
	nickname?: string | null
	imageUrl?: string | null
	playersToTitles?: {
		title: {
			type: "internal" | "external"
			title?: string
			shortTitle?: string
		}
	}[]
	defendingChampions?: {
		championship: {
			name: string
		}
	}[]
}

export const Actions = ({
	id,
	name,
	nickname,
	imageUrl,
	playersToTitles,
	defendingChampions,
}: Props) => {
	const [open, setOpen] = React.useState(false)
	const gradient = React.useMemo(() => getGradient(id), [id])

	const internalTitles = React.useMemo(() => {
		return (
			playersToTitles?.filter((title) => title.title.type === "internal") || []
		)
	}, [playersToTitles])

	const handleKeyboardEvent = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			setOpen(true)
		}
	}

	return (
		<>
			<div className="flex items-center gap-3">
				<Button
					className="flex cursor-pointer items-center gap-3"
					onClick={() => setOpen(true)}
					onKeyDown={handleKeyboardEvent}
					onKeyUp={handleKeyboardEvent}
					variant="link"
				>
					<Avatar className="h-8 w-8 rounded-md">
						<AvatarImage alt={name} src={imageUrl || undefined} />
						<AvatarFallback style={gradient} />
					</Avatar>
					<div className="whitespace-nowrap font-medium">
						{internalTitles.length > 0 && (
							<span className="text-highlight">
								{internalTitles.map((t) => t.title.shortTitle).join(" ")}
							</span>
						)}{" "}
						{nickname || name}
					</div>
				</Button>
				<div className="flex items-center gap-2">
					{defendingChampions?.map((championship) => (
						<div key={championship.championship.name}>
							{formatDefendingChampions(championship.championship.name)}
						</div>
					))}
				</div>
			</div>

			{open && <PlayerSheet id={id} open={open} setOpen={setOpen} />}
		</>
	);
}
