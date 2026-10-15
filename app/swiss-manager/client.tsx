import type { Metadata } from "next"
import { siteConfig } from "@/lib/site"
import SwissManagerClient from "./client"

export const metadata: Metadata = {
	title: "Swiss Manager Export",
	description: "Gere arquivos Excel compatíveis com o Swiss Manager.",
	openGraph: {
		url: `${siteConfig.url}/swiss-manager`,
		title: "Swiss Manager Export",
		description: "Gere arquivos Excel compatíveis com o Swiss Manager.",
		siteName: siteConfig.name,
	},
}

export default function Page() {
	return <SwissManagerClient />
}
