import React from "react";
import type { Metadata } from "next";
import { MegaphoneIcon } from "lucide-react";

import { getAnnouncementsByPage } from "@/db/queries";
import { siteConfig } from "@/lib/site";

import { Announcement } from "@/components/announcement";
import { AnnouncementLink } from "@/components/announcement-link";
import {
  PageHeader,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 2592000;

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
  return [
    { searchParams: { page: "1" } },
    { searchParams: { page: "2" } },
    { searchParams: { page: "3" } },
  ];
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;

  const { announcements, pagination } = await getAnnouncementsByPage(
    currentPage
  );
  const { totalPages, hasNextPage, hasPreviousPage } = pagination;

  const getPageNumbers = (totalPages: number, currentPage: number) => {
    const MAX_VISIBLE_PAGES = 5;
    let pageNumbers: Array<number | "ellipsis"> = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);

      if (start > 1) pageNumbers.push(1);
      if (start > 2) pageNumbers.push("ellipsis");

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) pageNumbers.push("ellipsis");
      if (end < totalPages) pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <>
      <PageHeader>
        <Announcement icon={MegaphoneIcon} />
        <PageHeaderHeading>Comunicados</PageHeaderHeading>
      </PageHeader>

      <section>
        <React.Suspense
          fallback={
            <div className="grid md:grid-cols-2 gap-1.5">
              {Array.from({ length: 12 }).map((_) => (
                <Skeleton
                  key={`skeleton-${crypto.randomUUID()}`}
                  className="w-full h-9 rounded-md"
                />
              ))}
            </div>
          }
        >
          <div className="grid md:grid-cols-2 gap-1.5">
            {announcements.map((announcement) => (
              <AnnouncementLink
                key={announcement.number}
                id={announcement.id}
                year={announcement.year}
                number={announcement.number}
                content={announcement.content}
              />
            ))}
          </div>
        </React.Suspense>

        {totalPages > 1 && (
          <Pagination className="mt-16">
            <PaginationContent>
              <PaginationItem>
                <PaginationFirst
                  href="/comunicados?page=1"
                  aria-disabled={!hasPreviousPage}
                  className={
                    !hasPreviousPage ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  href={`/comunicados?page=${Math.max(1, currentPage - 1)}`}
                  aria-disabled={!hasPreviousPage}
                  className={
                    !hasPreviousPage ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {getPageNumbers(totalPages, currentPage).map((pageNum) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${crypto.randomUUID()}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={`/comunicados?page=${pageNum}`}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href={`/comunicados?page=${Math.min(
                    totalPages,
                    currentPage + 1
                  )}`}
                  aria-disabled={!hasNextPage}
                  className={
                    !hasNextPage ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLast
                  href={`/comunicados?page=${totalPages}`}
                  aria-disabled={!hasNextPage}
                  className={
                    !hasNextPage ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </section>
    </>
  );
}
