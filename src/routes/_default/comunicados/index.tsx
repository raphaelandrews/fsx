import React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  ErrorComponent,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { MegaphoneIcon } from "lucide-react";
import { z } from "zod";

import { announcementsByPageQueryOptions } from "~/db/queries";
import { siteConfig } from "~/utils/config";

import { Announcement } from "~/components/announcement";
import { AnnouncementLink } from "~/components/announcement-link";
import { NotFound } from "~/components/not-found";
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
import { Skeleton } from "~/components/ui/skeleton";

const searchSchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => {
      const page = Number(val);
      return !Number.isNaN(page) && page > 0 ? String(page) : "1";
    }),
});

export const Route = createFileRoute("/_default/comunicados/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context: { queryClient }, deps: { page } }) => {
    await queryClient.ensureQueryData(
      announcementsByPageQueryOptions(Number(page))
    );
  },
  head: () => ({
    meta: [
      {
        title: `Comunicados | ${siteConfig.name}`,
        description: "Comunicados da FSX",
        ogUrl: `${siteConfig.url}/comunicados`,
        image: `${siteConfig.url}/og/og-comunicados.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader>
        <Announcement icon={MegaphoneIcon} />
        <PageHeaderHeading>Comunicados</PageHeaderHeading>
        <PageHeaderDescription>
          Divulgação de titulações e outras informações.
        </PageHeaderDescription>
      </PageHeader>

      <React.Suspense fallback={<AnnouncementLinkSkeleton />}>
        <AnnouncementLinks />
      </React.Suspense>
    </>
  );
}

function AnnouncementLinks() {
  const { page } = useSearch({ from: "/_default/comunicados/" });
  const currentPage = Number(page);
  const navigate = useNavigate();

  const { data } = useSuspenseQuery(
    announcementsByPageQueryOptions(currentPage)
  );

  const announcements = data.announcements;
  const totalPages = data.pagination.totalPages;

  const paginate = (newPage: number) => {
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
      if (currentPage <= 3) {
        pageNumbers = [1, 2, 3, 4, "ellipsis-end", totalPages];
      } else if (currentPage >= totalPages - 2) {
        pageNumbers = [
          1,
          "ellipsis-start",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      } else {
        pageNumbers = [
          1,
          "ellipsis-start",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis-end",
          totalPages,
        ];
      }
    }

    return pageNumbers;
  };

  return (
    <section>
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

      {data && totalPages > 1 && (
        <Pagination className="mt-16">
          <PaginationContent>
            <PaginationItem disabled={currentPage === 1}>
              <PaginationFirst onClick={() => paginate(1)} />
            </PaginationItem>
            <PaginationItem disabled={currentPage === 1}>
              <PaginationPrevious onClick={() => paginate(currentPage - 1)} />
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
                    isActive={pageNum === currentPage}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem disabled={currentPage === totalPages}>
              <PaginationNext onClick={() => paginate(currentPage + 1)} />
            </PaginationItem>
            <PaginationItem disabled={currentPage === totalPages}>
              <PaginationLast onClick={() => paginate(totalPages)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  );
}

function AnnouncementLinkSkeleton() {
  const SKELETON_KEYS = React.useMemo(
    () => Array.from({ length: 12 }, (_, i) => `skeleton-${i}`),
    []
  );

  return (
    <div className="grid md:grid-cols-2 gap-1.5">
      {SKELETON_KEYS.map((key) => (
        <Skeleton key={key} className="w-full h-9 rounded-md" />
      ))}
    </div>
  );
}
