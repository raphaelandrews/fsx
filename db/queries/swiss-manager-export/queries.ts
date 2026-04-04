import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"

export async function getPlayersForSwissManager() {
	"use cache"
	cacheTag("players", "swiss-manager-export")
	cacheLife("days")

	return db.query.players.findMany({
		columns: {
			id: true,
			name: true,
			sex: true,
			birth: true,
			classic: true,
			rapid: true,
			blitz: true,
		},
		with: {
			club: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
		where: (players, { eq }) => eq(players.active, true),
		orderBy: (players, { desc }) => [desc(players.rapid)],
	})
}

export type SwissManagerPlayer = Awaited<
	ReturnType<typeof getPlayersForSwissManager>
>[number]
