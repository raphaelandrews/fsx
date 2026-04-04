import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"

export async function getCircuits() {
	"use cache"
	cacheTag("circuits")
	cacheLife("weeks")

	return db.query.circuits.findMany({
		columns: {
			name: true,
			type: true,
		},
		with: {
			circuitPhase: {
				columns: {
					id: true,
					order: true,
				},
				with: {
					tournament: {
						columns: {
							name: true,
						},
					},
					circuitPodiums: {
						columns: {
							category: true,
							place: true,
							points: true,
						},
						orderBy: (podiums, { desc }) => [desc(podiums.points)],
						with: {
							player: {
								columns: {
									id: true,
									name: true,
									nickname: true,
									imageUrl: true,
								},
								with: {
									club: {
										columns: {
											id: true,
											name: true,
											logo: true,
										},
									},
									playersToTitles: {
										columns: {},
										with: {
											title: {
												columns: {
													shortTitle: true,
													type: true,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	})
}
