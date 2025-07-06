import type { Metadata } from "next"
import { TrophyIcon } from "lucide-react"

import { getChampions } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { Announcement } from "@/components/announcement"
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Galeria de Campeões",
  description: "Campeões Sergipanos.",
  openGraph: {
    url: `${siteConfig.url}/campeoes`,
    title: "Galeria de Campeões",
    description: "Campeões Sergipanos.",
    siteName: "Galeria de Campeões",
  },
};
export default async function Page() {
	const data = await getChampions()

	const championshipMap = data.reduce(
		(acc, championship) => {
			acc[championship.name] = championship.tournaments
				.map((tournament) => ({
					...tournament,
					date: tournament.date ? new Date(tournament.date) : null,
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

	const tabContent = [
		{ value: "classic", name: "Absoluto" },
		{ value: "rapid", name: "Rápido" },
		{ value: "blitz", name: "Blitz" },
		{ value: "female", name: "Feminino" },
		{ value: "team", name: "Equipes" },
	]

	return (
		<>
			<PageHeader>
				<Announcement icon={TrophyIcon} />
				<PageHeaderHeading>Campeões</PageHeaderHeading>
			</PageHeader>

			<Tabs defaultValue="classic">
				<TabsList className="grid h-20 grid-cols-3 grid-rows-2 sm:h-[inherit] sm:w-[500px] sm:grid-cols-5 sm:grid-rows-1">
					{tabContent.map((tab) => (
						<TabsTrigger key={tab.value} value={tab.value}>
							{tab.name}
						</TabsTrigger>
					))}
				</TabsList>

				{tabContent.map((tab) => (
					<TabsContent key={tab.value} value={tab.value}>
						<DataTable
							columns={columns}
							data={championshipMap[tab.name] ?? []}
						/>
					</TabsContent>
				))}
			</Tabs>
		</>
	)
}
