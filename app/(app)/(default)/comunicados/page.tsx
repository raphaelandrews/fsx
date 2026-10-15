import React from "react";
import type { Metadata } from "next";
import { MegaphoneIcon } from "lucide-react";

import { siteConfig } from "@/lib/site";

import { AnnouncementList } from "./components/announcement-list";
import { AnnouncementSkeleton } from "./components/announcement-skeleton";
import { PageWrapper } from "@/components/ui/page-wrapper";

export const metadata: Metadata = {
  title: "Comunicados",
  description: "Comunicados da Federação Sergipana de Xadrez.",
  openGraph: {
    url: `${siteConfig.url}/comunicados`,
    title: "Comunicados",
    description: "Comunicados da Federação Sergipana de Xadrez.",
    siteName: "Comunicados",
  },
};

export async function generateStaticParams() {
  return [{ page: "1" }, { page: "2" }, { page: "3" }];
}

async function AnnouncementContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  return <AnnouncementList currentPage={currentPage} />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <PageWrapper icon={MegaphoneIcon} label="Comunicados">
      <React.Suspense fallback={<AnnouncementSkeleton />}>
        <AnnouncementContent searchParams={searchParams} />
      </React.Suspense>
    </PageWrapper>
  );
}
