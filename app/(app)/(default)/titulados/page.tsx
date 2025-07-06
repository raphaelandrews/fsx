import type { Metadata } from "next"
import { BookmarkIcon } from "lucide-react"

import { getTitledPlayers } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { Announcement } from "@/components/announcement"
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header"

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
			<PageHeader>
				<Announcement icon={BookmarkIcon} />
				<PageHeaderHeading>Titulados</PageHeaderHeading>
			</PageHeader>

			<DataTable columns={columns} data={data} />
		</>
	)
}
