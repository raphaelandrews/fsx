import type { Metadata } from "next"
import { BarChart2Icon } from "lucide-react"

import { siteConfig } from "@/lib/site"

import { Client } from "./client"
import { Announcement } from "@/components/announcement"
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header"

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
	return (
		<>
			<PageHeader>
				<Announcement icon={BarChart2Icon} />
				<PageHeaderHeading>Ratings</PageHeaderHeading>
			</PageHeader>

			<Client />
		</>
	)
}
