"use client"

import { UserIcon } from "lucide-react"
import type { PlayerById } from "@/db/queries"

import { PlayerProfile } from "@/components/player/player-profile"
import { PageWrapper } from "@/components/ui/page-wrapper"

export function Client({ player }: { player: PlayerById }) {
	return (
		<PageWrapper icon={UserIcon} label="Perfil">
			<PlayerProfile player={player} />
		</PageWrapper>
	)
}
