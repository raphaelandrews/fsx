import { Suspense } from "react";
import { HomeIcon } from "lucide-react";

import { getNews } from "@/db/queries";

import { Announcement } from "@/components/announcement";
import { NewsCard } from "@/components/news-card";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 2592000;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;

  const { news, pagination } = await getNews(currentPage);

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
        <Announcement icon={HomeIcon} />
        <PageHeaderHeading>Notícias</PageHeaderHeading>
        <PageHeaderDescription>
          Acesse as informações mais recentes da FSX.
        </PageHeaderDescription>
      </PageHeader>

      <section>
        <Suspense
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
            {news.map((newsItem) => (
              <NewsCard
                key={newsItem.id}
                id={newsItem.id}
                title={newsItem.title}
                image={newsItem.image ?? undefined}
                slug={newsItem.slug ?? ""}
              />
            ))}
          </div>
        </Suspense>

        {totalPages > 1 && (
          <Pagination className="mt-16">
            <PaginationContent>
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
            </PaginationContent>
          </Pagination>
        )}
      </section>
    </>
  );
}
