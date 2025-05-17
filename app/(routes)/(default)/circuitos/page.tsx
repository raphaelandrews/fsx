import type { Metadata } from "next";
import { MedalIcon } from "lucide-react";

import { getCircuits } from "@/db/queries/circuits/queries";
import { siteConfig } from "@/lib/site";

import { Client } from "./client";
import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import type { Circuit } from "./components/types";

export const metadata: Metadata = {
  title: "Circuitos",
  description: "Circuitos de Xadrez de Sergipe",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/circuitos`,
    title: "FSX | Circuitos",
    description:
      "Classificação e informações dos circuitos de Xadrez de Sergipe",
    siteName: "FSX | Circuitos",
    images: [
      {
        url: `${siteConfig.url}/og/og-circuitos.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

export default async function Page() {
  // Fetch data on the server
  const circuits = await getCircuits();

  return (
    <>
      <PageHeader>
        <Announcement icon={MedalIcon} />
        <PageHeaderHeading>Circuitos</PageHeaderHeading>
        <PageHeaderDescription>
          Confira a classificação dos circuitos de Xadrez de Sergipe.
        </PageHeaderDescription>
      </PageHeader>

      {/* Pass the fetched data to the Client component */}
      <Client circuits={circuits as Circuit[]} />
    </>
  );
}
