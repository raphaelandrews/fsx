import { useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import { z } from "zod";

import { API_BASE_URL } from "~/lib/utils";

import { createAnnouncementsQueries, createNewsQueries } from "@fsx/engine/queries";

import AnnouncementLink from "~/components/announcement-link";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/ui/page-header";
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
} from "~/components/ui/pagination";
import { Announcement } from "~/components/announcement";
import { Skeleton } from "~/components/ui/skeleton";

const { announcementsQueryOptions } = createAnnouncementsQueries({
  apiUrl: API_BASE_URL,
});

const searchSchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => {
      const page = Number(val);
      return !Number.isNaN(page) && page > 0 ? String(page) : "1";
    }),
});

export const Route = createFileRoute("/comunicados/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context: { queryClient }, deps: { page } }) => {
    const queryOptions = announcementsQueryOptions(Number(page));
    const existingData = queryClient.getQueryData(queryOptions.queryKey);
    const state = existingData
      ? queryClient.getQueryState(queryOptions.queryKey)
      : null;

    if (
      !existingData ||
      (state && state.dataUpdatedAt < Date.now() - 5 * 60 * 1000)
    ) {
      return queryClient.fetchQuery(queryOptions);
    }

    return existingData;
  },
  component: AnnouncementsIndexComponent,
});

function AnnouncementsIndexComponent() {
  const { page } = useSearch({ from: "/comunicados/" });
  const currentPage = Number(page);
  const navigate = useNavigate();

  const { data, isLoading, isFetching, isPending } = useQuery(announcementsQueryOptions(currentPage));

  const announcements = data?.announcements ?? [];
  const totalPages = data?.pagination?.totalPages ?? 0;

  const SKELETON_KEYS = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `skeleton-${i}`),
    []
  );

  const queryClient = useQueryClient();
  const prefetchedPages = useRef<Set<number>>(new Set());

  const paginate = (newPage: number) => {
    queryClient.invalidateQueries({
      queryKey: ["paginated-announcements", currentPage],
    });

    navigate({
      to: "/comunicados",
      search: { page: String(newPage) },
      replace: true,
    });

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 0);
  };

  const getPageNumbers = (totalPages: number) => {
    const MAX_VISIBLE_PAGES = 5;
    let pageNumbers: Array<number | "ellipsis-start" | "ellipsis-end"> = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pageNumbers.push(1);
      const leftBound = Math.max(2, currentPage - 1);
      const rightBound = Math.min(totalPages - 1, currentPage + 1);

      if (leftBound > 2) {
        pageNumbers.push("ellipsis-start");
      }

      for (let i = leftBound; i <= rightBound; i++) {
        pageNumbers.push(i);
      }

      if (rightBound < totalPages - 1) {
        pageNumbers.push("ellipsis-end");
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const prefetchPage = useCallback(
    (pageNum: number) => {
      if (!prefetchedPages.current.has(pageNum)) {
        const queryOptions = announcementsQueryOptions(pageNum);
        queryClient.prefetchQuery(queryOptions);
        prefetchedPages.current.add(pageNum);
      }
    },
    [queryClient]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const visiblePages = getPageNumbers(totalPages).filter(
      (pageNum): pageNum is number => typeof pageNum === "number"
    );
    visiblePages.forEach(prefetchPage);
  }, [currentPage, totalPages, prefetchPage]);

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
          {isLoading || isFetching
            ? SKELETON_KEYS.map((key) => (
                <div
                  key={key}
                  className="rounded-xl border text-card-foreground flex flex-col gap-2 p-0 border-none shadow-none bg-transparent"
                >
                  <Skeleton className="w-full rounded-md aspect-video" />
                  <Skeleton className="w-4/5 h-6 rounded-md" />
                </div>
              ))
            : announcements.map((announcement) => (
                <AnnouncementLink
                  key={announcement.number}
                  id={announcement.id}
                  year={announcement.year}
                  number={announcement.number}
                  content={announcement.content}
                />
              ))}
        </div>

        {data && totalPages > 1 && (
          <Pagination className="mt-16">
            <PaginationContent>
              <PaginationItem disabled={currentPage === 1}>
                <PaginationFirst
                  onClick={() => paginate(1)}
                  onMouseEnter={() => prefetchPage(1)}
                />
              </PaginationItem>
              <PaginationItem disabled={currentPage === 1}>
                <PaginationPrevious
                  onClick={() => paginate(currentPage - 1)}
                  onMouseEnter={() => prefetchPage(currentPage - 1)}
                />
              </PaginationItem>

              {getPageNumbers(totalPages).map((pageNum) =>
                pageNum === "ellipsis-start" || pageNum === "ellipsis-end" ? (
                  <PaginationItem key={pageNum}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${pageNum}`}>
                    <PaginationLink
                      onClick={() => paginate(pageNum as number)}
                      onMouseEnter={() => prefetchPage(pageNum as number)}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem disabled={currentPage === totalPages}>
                <PaginationNext
                  onClick={() => paginate(currentPage + 1)}
                  onMouseEnter={() => prefetchPage(currentPage + 1)}
                />
              </PaginationItem>
              <PaginationItem disabled={currentPage === totalPages}>
                <PaginationLast
                  onClick={() => paginate(totalPages)}
                  onMouseEnter={() => prefetchPage(totalPages)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </section>
    </>
  );
}

export default AnnouncementsIndexComponent;
