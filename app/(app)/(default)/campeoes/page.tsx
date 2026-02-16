import { Suspense } from "react"
import { ChampionsSkeleton } from "./components/champions-skeleton"
import type { Metadata } from "next"
import { TrophyIcon } from "lucide-react"

import { getChampions } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { PageWrapper } from "@/components/ui/page-wrapper"
import { Client } from "./client"

export const metadata: Metadata = {
	title: "Galeria de Campeões",
	description: "Campeões Sergipanos.",
	openGraph: {
		url: `${siteConfig.url}/campeoes`,
		title: "Galeria de Campeões",
		description: "Campeões Sergipanos.",
	},
}

export default async function Page() {
	const data = await getChampions()

	const championshipMap = data.reduce(
		(acc, championship) => {
			acc[championship.name] = championship.tournaments
				.map((tournament) => ({
					...tournament,
					date: tournament.date ? new Date(tournament.date).toISOString() : null,
					tournamentPodiums: tournament.tournamentPodiums.map((podium) => ({
						place: podium.place,
						player: {
							id: Number(podium.player.id),
							name: podium.player.name,
							nickname: podium.player.nickname ?? null,
							imageUrl: podium.player.imageUrl ?? null,
							location: podium.player.location ?? null,
							playersToTitles: podium.player.playersToTitles.map((t) => ({
								title: {
									type: t.title.type,
									shortTitle: t.title.shortTitle,
								},
							})),
						},
					})),
				}))
				.reverse()
			return acc
		},
		// biome-ignore lint/suspicious/noExplicitAny: No
		{} as Record<string, any>
	)

	return (
		<PageWrapper icon={TrophyIcon} label="Campeões">
			<Suspense fallback={<ChampionsSkeleton />}>
				<Client championshipMap={championshipMap} />
			</Suspense>
		</PageWrapper>
	)
}
