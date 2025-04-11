import type { Metadata } from "next";
import Link from "next/link";
import { MegaphoneIcon } from "lucide-react";

import { getPaginatedAnnouncements } from "@/lib/queries";
import { siteConfig } from "@/utils/site";

import AnnouncementLink from "@/components/announcement-link";
import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";

const pageSize = 12;

export const metadata: Metadata = {
  title: "Comunicados",
  description: "Comunicados da FSX",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/comunicados`,
    title: "FSX | Comunicados",
    description: "Comunicados da Federação Sergipana de Xadrez",
    siteName: "FSX | Comunicados",
    images: [
      {
        url: `${siteConfig.url}/og/og-comunicados.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

export async function generateStaticParams() {
  const firstPageData = await getPaginatedAnnouncements(1, pageSize);
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
  const { data: announcements, pagination } = await getPaginatedAnnouncements(
    page,
    pageSize
  );
  const { currentPage, totalPages } = pagination;

  return (
    <>
      <PageHeader>
        <Announcement icon={MegaphoneIcon} />
        <PageHeaderHeading>Comunicados</PageHeaderHeading>
        <PageHeaderDescription>
          Divulgação de titulações e outras informações.
        </PageHeaderDescription>
      </PageHeader>

      <section>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {announcements.map((announcement) => (
            <AnnouncementLink
              key={announcement.id}
              id={announcement.id}
              year={announcement.year}
              number={announcement.number}
              content={announcement.content}
            />
          ))}
        </div>
      </section>

      <nav className="flex justify-center mt-8">
        {currentPage > 1 && (
          <Link
            href={`/comunicados/${currentPage - 1}`}
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
            href={`/comunicados/${currentPage + 1}`}
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
