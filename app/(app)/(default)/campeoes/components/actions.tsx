"use client"

import { useMemo, useState } from "react"

import { getGradient } from "@/lib/generate-gradients"

import { PlayerSheet } from "@/components/sheets/player/player-sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Props {
	id: number
	name: string
	nickname?: string | null
	image?: string | null
	shortTitle?: string | null
}

export const Actions = ({ id, name, nickname, image, shortTitle }: Props) => {
	const [open, setOpen] = useState(false)
	const gradient = useMemo(() => getGradient(id), [id])

	const handleKeyboardEvent = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			setOpen(true)
		}
	}

	return (
		<>
			<Button
				className="flex cursor-pointer items-center gap-3"
				onClick={() => setOpen(true)}
				onKeyDown={handleKeyboardEvent}
				onKeyUp={handleKeyboardEvent}
				variant="link"
			>
				<Avatar className="h-8 w-8 rounded-md">
					<AvatarImage alt={name} src={image ? image : ""} />
					<AvatarFallback style={gradient} />
				</Avatar>
				<div className="whitespace-nowrap font-medium">
					<span className="text-gold">{shortTitle}</span>{" "}
					{nickname ? nickname : name}
				</div>
			</Button>

			{open && <PlayerSheet id={id} open={open} setOpen={setOpen} />}
		</>
	)
}
