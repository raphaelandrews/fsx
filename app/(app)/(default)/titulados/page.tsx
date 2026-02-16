import { Suspense } from "react"
import { TitledPlayersSkeleton } from "./components/titled-players-skeleton"
import type { Metadata } from "next"
import { BookmarkIcon } from "lucide-react"

import { getTitledPlayers } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { PageWrapper } from "@/components/ui/page-wrapper"
import { Client } from "./client"

export const metadata: Metadata = {
	title: "Titulados",
	description: "Titulados da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/titulados`,
		title: "Titulados",
		description: "Titulados da Federação Sergipana de Xadrez.",
	},
}

export default async function Page() {
	const data = await getTitledPlayers()

	return (
		<PageWrapper icon={BookmarkIcon} label="Titulados">
			<Suspense fallback={<TitledPlayersSkeleton />}>
				<Client data={data} />
			</Suspense>
		</PageWrapper>
	)
}
