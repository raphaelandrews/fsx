import type { Metadata } from "next";
import { ScrollIcon } from "lucide-react";

import { getPlayersRoles } from "@/db/queries";
import { siteConfig } from "@/lib/site";

import { Client } from "./client";
import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Membros",
  description: "Diretoria e árbitros da FSX.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/membros`,
    title: "FSX | Membros",
    description: "Diretoria e árbitros da FSX.",
    siteName: "FSX | Membros",
    images: [
      {
        url: `${siteConfig.url}/og/og.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

export default async function Page() {
  const data = await getPlayersRoles();

  return (
    <>
      <PageHeader>
        <Announcement icon={ScrollIcon} />
        <PageHeaderHeading>Membros</PageHeaderHeading>
        <PageHeaderDescription>
          Diretoria e árbitros da FSX.
        </PageHeaderDescription>
      </PageHeader>

      <Client roles={data}/>
    </>
  );
}
