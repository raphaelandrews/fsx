import type { Metadata } from "next";
import Link from "next/link";
import { HomeIcon } from "lucide-react";

import { getPaginatedNews } from "@/lib/queries";
import { siteConfig } from "@/utils/site";
import NewsCard from "@/components/news-card";
import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";

const pageSize = 12;

export const metadata: Metadata = {
  title: "Notícias",
  description: "Notícias da FSX",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/noticias`,
    title: "FSX | Notícias",
    description: "Notícias e eventos da Federação Sergipana de Xadrez",
    siteName: "FSX | Notícias",
    images: [
      {
        url: `${siteConfig.url}/og/og-noticias.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

export async function generateStaticParams() {
  const firstPageData = await getPaginatedNews(1, pageSize);
  const totalPages = firstPageData.pagination.totalPages;

  const pages = [];
  for (let page = 1; page <= totalPages; page++) {
    pages.push({ pageNumber: page.toString() });
  }

  return pages;
}

export default async function NewsPage(props: {
  params: Promise<{ pageNumber: string }>;
}) {
  const { pageNumber } = await props.params;
  const page = Number.parseInt(pageNumber, 10);
  const { data: news, pagination } = await getPaginatedNews(page, pageSize);
  const { currentPage, totalPages } = pagination;

  return (
    <>
      <PageHeader>
        <Announcement icon={HomeIcon} />
        <PageHeaderHeading>Notícias</PageHeaderHeading>
        <PageHeaderDescription>
          Acesse as informações mais recentes da FSX.
        </PageHeaderDescription>
      </PageHeader>

      <section>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {news.map((newsItem) => (
            <NewsCard
              key={newsItem.id}
              id={newsItem.id}
              title={newsItem.title}
              image={newsItem.image}
            />
          ))}
        </div>
      </section>

      <nav className="flex justify-center mt-8">
        {currentPage > 1 && (
          <Link
            href={`/noticias/${currentPage - 1}`}
            prefetch={true}
            className="mr-4"
          >
            Previous
          </Link>
        )}
        <span>
          Page {currentPage} of {totalPages}
        </span>
        {currentPage < totalPages && (
          <Link
            href={`/noticias/${currentPage + 1}`}
            prefetch={true}
            className="ml-4"
          >
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
