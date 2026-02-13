import type { Metadata } from "next"
import { BookmarkIcon } from "lucide-react"

import { getTitledPlayers } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { DottedX } from "@/components/dotted-x"

export const metadata: Metadata = {
	title: "Titulados",
	description: "Titulados da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/titulados`,
		title: "Titulados",
		description: "Titulados da Federação Sergipana de Xadrez.",
		siteName: "Titulados",
	},
};

export default async function Page() {
	const data = await getTitledPlayers()

	return (
		<>
			<PageHeader icon={BookmarkIcon} label="Titulados">
				<DottedX>
					<DataTable columns={columns} data={data} />
				</DottedX>
			</PageHeader>
		</>
	)
}
