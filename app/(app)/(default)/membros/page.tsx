import type { Metadata } from "next"
import { ScrollIcon } from "lucide-react"

import { getPlayersRoles } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { Client } from "./client"
import { Announcement } from "@/components/announcement"
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header"

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
			<PageHeader>
				<Announcement icon={ScrollIcon} />
				<PageHeaderHeading>Membros</PageHeaderHeading>
			</PageHeader>

			<Client roles={data} />
		</>
	)
}
