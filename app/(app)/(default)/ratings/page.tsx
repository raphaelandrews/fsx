import type { Metadata } from "next"
import { BarChart2Icon } from "lucide-react"

import { siteConfig } from "@/lib/site"
import { getClubs, getLocations } from "@/db/queries"

import { Client } from "./client"
import { PageWrapper } from "@/components/ui/page-wrapper"

export const metadata: Metadata = {
	title: "Ratings",
	description: "Ratings da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/rating`,
		title: "Ratings",
		description: "Ratings da Federação Sergipana de Xadrez.",
		siteName: "Ratings",
	},
};

export default async function Page() {
	const [clubsData, locationsData] = await Promise.all([
		getClubs(),
		getLocations(),
	])

	const clubs = clubsData.map((club) => ({
		value: club.name,
		label: club.name,
	}))

	const locations = locationsData.map((location) => ({
		value: location.name,
		label: location.name,
	}))

	return (
		<PageWrapper icon={BarChart2Icon} label="Ratings">
			<Client clubs={clubs} locations={locations} />
		</PageWrapper>
	)
}
