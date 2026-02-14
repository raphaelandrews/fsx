import { db } from "@/db"
import { unstable_cache } from "@/lib/unstable_cache"

export const getPlayersForSwissManager = unstable_cache(
	() =>
		db.query.players.findMany({
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
		}),
	["swiss-manager-export"],
	{
		revalidate: 60 * 60 * 24, // 24 hours
		tags: ["players", "swiss-manager-export"],
	}
)

export type SwissManagerPlayer = Awaited<
	ReturnType<typeof getPlayersForSwissManager>
>[number]
