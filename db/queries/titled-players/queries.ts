import { sql, desc } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { playersToTitles } from "@/db/schema"

export async function getTitledPlayers() {
	"use cache"
	cacheTag("players", "titled-players")
	cacheLife("weeks")

	return db.query.players.findMany({
		columns: {
			id: true,
			name: true,
			imageUrl: true,
			rapid: true,
		},
		with: {
			playersToTitles: {
				columns: {},
				with: {
					title: {
						columns: {
							title: true,
							shortTitle: true,
							type: true,
						},
					},
				},
			},
		},
		where: (players, { exists }) =>
			exists(
				db
					.select()
					.from(playersToTitles)
					.where(sql`${playersToTitles.playerId} = ${players.id}`)
			),
		orderBy: (players) => [desc(players.rapid)],
	})
}
