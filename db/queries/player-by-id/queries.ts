import { eq } from "drizzle-orm"
import { db } from "@/db"
import { players } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

export const getPlayerById = async (id: number) => {
	const cachedFn = unstable_cache(
		async (playerId: number) =>
			db.query.players.findFirst({
				where: eq(players.id, playerId),
				columns: {
					id: true,
					name: true,
					nickname: true,
					blitz: true,
					rapid: true,
					classic: true,
					active: true,
					imageUrl: true,
					cbxId: true,
					fideId: true,
					verified: true,
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
					playersToTournaments: {
						columns: {
							oldRating: true,
							variation: true,
						},
						with: {
							tournament: {
								columns: {
									name: true,
									ratingType: true,
								},
							},
						},
					},
					playersToRoles: {
						columns: {},
						with: {
							role: {
								columns: {
									role: true,
									shortRole: true,
									type: true,
								},
							},
						},
					},
					tournamentPodiums: {
						columns: {
							place: true,
						},
						with: {
							tournament: {
								columns: {
									name: true,
									date: true,
									championshipId: true,
								},
							},
						},
					},
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
			}),
		["get-player-by-id", `player-${id}`],
		{
			revalidate: 60 * 60 * 24 * 15,
			tags: ["players", `player-${id}`],
		}
	)

	return await cachedFn(id)
}