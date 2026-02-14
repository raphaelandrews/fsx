import { Suspense } from "react"
import type { Metadata } from "next"
import { BookmarkIcon } from "lucide-react"

import { getTitledPlayers } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { PageHeader } from "@/components/ui/page-header"
import { Client } from "./client"

export const metadata: Metadata = {
	title: "Titulados",
	description: "Titulados da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/titulados`,
		title: "Titulados",
		description: "Titulados da Federação Sergipana de Xadrez.",
		siteName: "Titulados",
	},
}

export default async function Page() {
	const data = await getTitledPlayers()

	return (
		<PageHeader icon={BookmarkIcon} label="Titulados">
			<Suspense fallback={<div>Carregando...</div>}>
				<Client data={data} />
			</Suspense>
		</PageHeader>
	)
}
