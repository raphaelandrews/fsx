"use client"

import { UserIcon } from "lucide-react"
import type { PlayerById } from "@/db/queries"

import { PlayerProfile } from "@/components/player/player-profile"
import { PageHeader } from "@/components/ui/page-header"

export function Client({ player }: { player: PlayerById }) {
	return (
		<PageHeader icon={UserIcon} label="Perfil">
			<PlayerProfile player={player} />
		</PageHeader>
	)
}
