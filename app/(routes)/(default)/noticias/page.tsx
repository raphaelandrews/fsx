import React from "react";
import type { Metadata } from "next";
import { NewspaperIcon } from "lucide-react";

import { getPostsByPage } from "@/db/queries";
import { siteConfig } from "@/lib/site";

import { Announcement } from "@/components/announcement";
import { PostCard } from "@/components/post-card";
import {
  PageHeader,
  PageHeaderDescription,
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

  const { posts, pagination } = await getPostsByPage(currentPage);
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
        <Announcement icon={NewspaperIcon} />
        <PageHeaderHeading>Notícias</PageHeaderHeading>
        <PageHeaderDescription>
          Acesse as informações mais recentes da FSX.
        </PageHeaderDescription>
      </PageHeader>

      <section>
        <React.Suspense
          fallback={
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`skeleton-${crypto.randomUUID()}`}>
                  <Skeleton className="w-full aspect-[2/1]" />
                  <Skeleton className="h-5 w-full mt-2 mb-1" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ))}
            </div>
          }
        >
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                image={post.image ?? undefined}
                slug={post.slug ?? ""}
              />
            ))}
          </div>
        </React.Suspense>

        {totalPages > 1 && (
          <Pagination className="mt-16">
            <PaginationContent>
              <PaginationItem>
                <PaginationFirst
                  href="/noticias?page=1"
                  aria-disabled={!hasPreviousPage}
                  className={
                    !hasPreviousPage ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  href={`/noticias?page=${Math.max(1, currentPage - 1)}`}
                  aria-disabled={!hasPreviousPage}
                  className={
                    !hasPreviousPage ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {getPageNumbers(totalPages, currentPage).map((pageNum, index) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${crypto.randomUUID()}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={`/noticias?page=${pageNum}`}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href={`/noticias?page=${Math.min(
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
                  href={`/noticias?page=${totalPages}`}
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
