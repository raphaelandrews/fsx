import type { Metadata } from "next"
import { ScrollIcon } from "lucide-react"

import { getPlayersRoles } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { Client } from "./client"
import { PageHeader } from "@/components/ui/page-header"
import { DottedX } from "@/components/dotted-x"

export const metadata: Metadata = {
	title: "Membros",
	description: "Diretoria e árbitros da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/membros`,
		title: "Membros",
		description: "Diretoria e árbitros da Federação Sergipana de Xadrez.",
		siteName: "Membros",
	},
};

export default async function Page() {
	const data = await getPlayersRoles()

	return (
		<>
			<PageHeader icon={ScrollIcon} label="Membros">
				<DottedX className="p-0">
					<Client roles={data} />
				</DottedX>
			</PageHeader>
		</>
	)
}
