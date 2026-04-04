import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"

export async function getPlayers() {
	"use cache"
	cacheTag("players", "players-list")
	cacheLife("weeks")

	return db.query.players.findMany({
		columns: {
			id: true,
			name: true,
			nickname: true,
			classic: true,
			rapid: true,
			blitz: true,
			imageUrl: true,
			birth: true,
			sex: true,
		},
		with: {
			club: {
				columns: {
					name: true,
					logo: true,
				},
			},
			location: {
				columns: {
					name: true,
					flag: true,
				},
			},
			defendingChampions: {
				columns: {},
				with: {
					championship: {
						columns: {
							name: true,
						},
					},
				},
			},
			playersToTitles: {
				columns: {
					id: true,
					playerId: true,
					titleId: true,
				},
				with: {
					title: {
						columns: {
							id: true,
							title: true,
							shortTitle: true,
							type: true,
						},
					},
				},
			},
		},
	})
}
