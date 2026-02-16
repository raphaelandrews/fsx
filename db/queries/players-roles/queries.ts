import { db } from "@/db"
import { unstable_cache } from "@/lib/unstable_cache"

export const getPlayersRoles = unstable_cache(
	async () => {
		const data = await db.query.roles.findMany({
			columns: {
				id: true,
				role: true,
				type: true,
			},
			with: {
				playersToRoles: {
					columns: {},
					with: {
						player: {
							columns: {
								id: true,
								name: true,
								imageUrl: true,
							},
						},
					},
				},
			},
		})

		const order = [8, 10, 6]

		const sortedData = data.map((role) => ({
			...role,
			playersToRoles: role.playersToRoles.sort((a, b) =>
				a.player.name.localeCompare(b.player.name)
			),
		}))

		return sortedData.sort((a, b) => {
			const indexA = order.indexOf(a.id)
			const indexB = order.indexOf(b.id)

			if (indexA !== -1 && indexB !== -1) {
				return indexA - indexB
			}

			if (indexA !== -1) return -1
			if (indexB !== -1) return 1

			return 0
		})
	},
	["get-players-roles"],
	{
		revalidate: 60 * 60 * 24 * 15,
		tags: ["players-roles"],
	}
)
