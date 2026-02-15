
import React from "react";
import type { Metadata } from "next";
import { NewspaperIcon } from "lucide-react";

import { siteConfig } from "@/lib/site";

import { NewsList } from "./components/news-list";
import { NewsSkeleton } from "./components/news-skeleton";
import { PageWrapper } from "@/components/ui/page-wrapper";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Notícias e eventos da Federação Sergipana de Xadrez.",
  openGraph: {
    url: `${siteConfig.url}/noticias`,
    title: "Notícias",
    description: "Notícias e eventos da Federação Sergipana de Xadrez.",
    siteName: "Notícias",
  },
};

export async function generateStaticParams() {
  return [
    { searchParams: { page: "1" } },
    { searchParams: { page: "2" } },
    { searchParams: { page: "3" } },
  ];
}

async function NewsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1

  return <NewsList currentPage={currentPage} />
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <PageWrapper icon={NewspaperIcon} label="Notícias">
      <React.Suspense fallback={<NewsSkeleton />}>
        <NewsContent searchParams={searchParams} />
      </React.Suspense>
    </PageWrapper>
  );
}
