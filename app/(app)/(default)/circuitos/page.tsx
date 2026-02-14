import type { Metadata } from "next"
import { MedalIcon } from "lucide-react"

import { getCircuits } from "@/db/queries/circuits/queries"
import { siteConfig } from "@/lib/site"

import { Client } from "./client"
import type { Circuit } from "./components/types"
import { PageHeader } from "@/components/ui/page-header"

export const metadata: Metadata = {
  title: "Circuitos",
  description:
    "Classificação e informações dos circuitos de Xadrez de Sergipe.",
  openGraph: {
    url: `${siteConfig.url}/circuitos`,
    title: "Circuitos",
    description:
      "Classificação e informações dos circuitos de Xadrez de Sergipe.",
    siteName: "Circuitos",
  },
};

export default async function Page() {
  const circuits = await getCircuits()

  return (
    <PageHeader icon={MedalIcon} label="Circuitos">
      <Client circuits={circuits as Circuit[]} />
    </PageHeader>
  )
}
