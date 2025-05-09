import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  ErrorComponent,
  type ErrorComponentProps,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import { z } from "zod";

import { newsQueryOptions } from "~/db/queries";

import { Announcement } from "~/components/announcement";
import { NewsCard } from "~/components/news-card";
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
import { NotFound } from "~/components/not-found";

const searchSchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => {
      const page = Number(val);
      return !Number.isNaN(page) && page > 0 ? String(page) : "1";
    }),
});

export const Route = createFileRoute("/_default/noticias/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context: { queryClient }, deps: { page } }) => {
    await queryClient.ensureQueryData(newsQueryOptions(Number(page)));
  },
  component: RouteComponent,
  errorComponent: NewsErrorComponent,
  notFoundComponent: () => {
    return <NotFound>Ops, algo deu errado</NotFound>;
  },
});

export function NewsErrorComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />;
}

function RouteComponent() {
  const { page } = useSearch({ from: "/_default/noticias/" });
  const currentPage = Number(page);
  const navigate = useNavigate();

  const { data } = useQuery(newsQueryOptions(currentPage));

  const news = data?.news ?? [];
  const totalPages = data?.pagination?.totalPages ?? 0;

  const paginate = (newPage: number) => {
    navigate({
      to: "/noticias",
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
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {news.map((newsItem) => (
            <NewsCard
              key={newsItem.id}
              id={newsItem.id}
              title={newsItem.title}
              image={newsItem.image}
              slug={newsItem.slug}
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
    </>
  );
}
