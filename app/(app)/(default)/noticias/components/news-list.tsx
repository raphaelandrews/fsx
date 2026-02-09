import { getPostsByPage } from "@/db/queries";

import { PostCard } from "@/components/post-card";
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

interface NewsListProps {
  currentPage: number;
}

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

export async function NewsList({ currentPage }: NewsListProps) {
  const { posts, pagination } = await getPostsByPage(currentPage)();
  const { totalPages, hasNextPage, hasPreviousPage } = pagination;

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            id={post.id}
            image={post.image ?? undefined}
            key={post.id}
            slug={post.slug ?? ""}
            title={post.title}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-16">
          <PaginationContent>
            <PaginationItem>
              <PaginationFirst
                aria-disabled={!hasPreviousPage}
                className={
                  hasPreviousPage ? "" : "pointer-events-none opacity-50"
                }
                href="/noticias?page=1"
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                aria-disabled={!hasPreviousPage}
                className={
                  hasPreviousPage ? "" : "pointer-events-none opacity-50"
                }
                href={`/noticias?page=${Math.max(1, currentPage - 1)}`}
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
                aria-disabled={!hasNextPage}
                className={hasNextPage ? "" : "pointer-events-none opacity-50"}
                href={`/noticias?page=${Math.min(totalPages, currentPage + 1)}`}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLast
                aria-disabled={!hasNextPage}
                className={hasNextPage ? "" : "pointer-events-none opacity-50"}
                href={`/noticias?page=${totalPages}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  );
}
