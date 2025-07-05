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
  description: "Titulados FSX",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/titulados`,
    title: "FSX | Titulados",
    description: "Titulados da Federação Sergipana de Xadrez",
    siteName: "FSX | Titulados",
    images: [
      {
        url: `/og?title=${encodeURIComponent("Titulados")}`,
      },
    ],
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
