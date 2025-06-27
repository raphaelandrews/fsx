import type { Metadata } from "next";
import { MedalIcon } from "lucide-react";

import { getCircuits } from "@/db/queries/circuits/queries";
import { siteConfig } from "@/lib/site";

import { Client } from "./client";
import type { Circuit } from "./components/types";
import { Announcement } from "@/components/announcement";
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header";
import { getQueryClient } from "@/hooks/get-query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

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
  const circuits = await getCircuits();

  return (
    <>
      <PageHeader>
        <Announcement icon={MedalIcon} />
        <PageHeaderHeading>Circuitos</PageHeaderHeading>
      </PageHeader>

      <Client circuits={circuits as Circuit[]} />
    </>
  );
}
