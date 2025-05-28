import type { Metadata } from "next";
import { BarChart2Icon } from "lucide-react";

import { siteConfig } from "@/lib/site";

import { RatingsTables } from "./ratings-tables";
import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Ratings",
  description: "Ratings da FSX",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/rating`,
    title: "FSX | Ratings",
    description: "Ratings da Federação Sergipana de Xadrez",
    siteName: "FSX | Ratings",
    images: [
      {
        url: `${siteConfig.url}/og/og-rating.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

export default async function Page() {
  return (
    <>
      <PageHeader>
        <Announcement icon={BarChart2Icon} />
        <PageHeaderHeading>Ratings</PageHeaderHeading>
        <PageHeaderDescription>
          Confira as tabelas de rating.
        </PageHeaderDescription>
      </PageHeader>

      <RatingsTables />
    </>
  );
}
