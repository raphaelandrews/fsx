// NOTE: project-customized — do NOT run `shadcn add pagination` to regenerate.
// This file replaced the default shadcn primitive with a self-contained
// component that handles smart truncation, mobile collapse, first/last
// shortcuts, and a framework-agnostic onPageChange API. See the README of
// the project for the rationale.

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

interface PaginationProps {
  /** Current page (1-indexed). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Whether a previous page exists. */
  hasPreviousPage: boolean;
  /** Whether a next page exists. */
  hasNextPage: boolean;
  /** Called with the new page number (1-indexed) when the user navigates. */
  onPageChange: (page: number) => void;
  /** Show the "Página X de Y" label below the controls (default false). */
  showLabel?: boolean;
  /** Show first/last shortcut buttons (default true). */
  showEdges?: boolean;
  /** Number of sibling pages to show around the current page (default 1). */
  siblingCount?: number;
  className?: string;
}

type PageItem =
  | { type: "page"; page: number; isCurrent: boolean }
  | { type: "ellipsis"; key: "start" | "end" };

/**
 * Build the page-item sequence with smart truncation:
 *   1 … 4 5 [6] 7 8 … 23
 *
 * - Always show first and last pages.
 * - Always show `siblingCount` pages on each side of the current page.
 * - Insert an ellipsis when there's a gap of ≥2 pages (so we never render
 *   two adjacent ellipses).
 */
function buildPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PageItem[] {
  // No truncation needed.
  const totalNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 buffers
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => ({
      type: "page" as const,
      page,
      isCurrent: page === currentPage,
    }));
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showStartEllipsis = leftSibling > 2;
  const showEndEllipsis = rightSibling < totalPages - 1;

  const items: PageItem[] = [];

  // First page is always shown.
  items.push({ type: "page", page: 1, isCurrent: currentPage === 1 });

  if (showStartEllipsis) {
    items.push({ type: "ellipsis", key: "start" });
  } else {
    // No leading gap — fill in pages 2..leftSibling.
    for (let page = 2; page < leftSibling; page++) {
      items.push({ type: "page", page, isCurrent: page === currentPage });
    }
  }

  // Sibling window around the current page.
  for (
    let page = leftSibling;
    page <= (showStartEllipsis ? Math.min(rightSibling, totalPages - 1) : rightSibling);
    page++
  ) {
    if (page === 1 || page === totalPages) continue; // first/last handled separately
    items.push({ type: "page", page, isCurrent: page === currentPage });
  }

  if (showEndEllipsis) {
    items.push({ type: "ellipsis", key: "end" });
  } else {
    for (let page = rightSibling + 1; page < totalPages; page++) {
      items.push({ type: "page", page, isCurrent: page === currentPage });
    }
  }

  // Last page is always shown (unless it was already pushed above).
  if (!items.some((item) => item.type === "page" && item.page === totalPages)) {
    items.push({ type: "page", page: totalPages, isCurrent: currentPage === totalPages });
  }

  return items;
}

function PageButton({
  page,
  isCurrent,
  onPageChange,
}: {
  page: number;
  isCurrent: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <Button
      aria-current={isCurrent ? "page" : undefined}
      aria-label={`Ir para a página ${page}`}
      className={cn("h-8 w-8 p-0 text-sm", isCurrent && "pointer-events-none")}
      onClick={() => onPageChange(page)}
      size="sm"
      variant={isCurrent ? "default" : "outline"}
    >
      {page}
    </Button>
  );
}

function Ellipsis({ keyId }: { keyId: "start" | "end" }) {
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 items-center justify-center text-muted-foreground"
      // Differentiate the two ellipses for screen readers / snapshot stability.
      data-ellipsis={keyId}
    >
      <HugeiconsIcon
        className="size-4"
        icon={MoreHorizontalCircle01Icon}
        strokeWidth={2}
      />
      <span className="sr-only">Mais páginas</span>
    </span>
  );
}

/**
 * Pagination — unified pagination control for the public site and any other
 * consumer.
 *
 * Framework-agnostic: the caller wires `onPageChange` to the router (or any
 * other state). The component only knows about page numbers.
 *
 * ## Visual design
 * - Page numbers: `outline` button (inactive) / `default` filled button (current).
 * - Prev / Next: `outline` button with chevron icon, "Anterior" / "Próxima" text
 *   hidden on mobile (icon only) and shown on `sm:` and up.
 * - First / Last: `ghost` icon-only button, hidden on mobile to keep the control
 *   tight on a 375px viewport.
 * - Ellipsis: rendered as a non-interactive span with `aria-hidden` and an
 *   `sr-only` "Mais páginas" label.
 * - "Página X de Y" label sits below on mobile, alongside the controls on `sm:`
 *   and up. Optional via `showLabel`.
 *
 * ## Edge cases
 * - `totalPages <= 1`: the component renders nothing. There is nothing to
 *   paginate.
 * - `currentPage` out of range: clamped visually only by `buildPageItems`; the
 *   caller is responsible for keeping the page state valid (the existing
 *   TanStack `validateSearch` already does this with `z.number().positive()`).
 */
export function Pagination({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  showLabel = false,
  showEdges = true,
  siblingCount = 1,
  className,
}: PaginationProps) {
  // Nothing to paginate — render nothing.
  if (totalPages <= 1) return null;

  const items = buildPageItems(currentPage, totalPages, siblingCount);

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        "flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {showEdges ? (
          <Button
            aria-label="Primeira página"
            className="hidden sm:inline-flex"
            disabled={!hasPreviousPage}
            onClick={() => onPageChange(1)}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon
              className="size-4"
              icon={ArrowLeftDoubleIcon}
              strokeWidth={2}
            />
          </Button>
        ) : null}

        <Button
          aria-label="Página anterior"
          className="gap-1.5 px-2.5"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon
            className="size-4"
            icon={ArrowLeft01Icon}
            strokeWidth={2}
          />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {/* Page-number list: hidden on mobile, expanded on sm+ to save space. */}
        <div className="hidden items-center gap-1 sm:flex">
          {items.map((item) =>
            item.type === "ellipsis" ? (
              <Ellipsis key={`ellipsis-${item.key}`} keyId={item.key} />
            ) : (
              <PageButton
                key={item.page}
                isCurrent={item.isCurrent}
                page={item.page}
                onPageChange={onPageChange}
              />
            )
          )}
        </div>

        <Button
          aria-label="Próxima página"
          className="gap-1.5 px-2.5"
          disabled={!hasNextPage}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          size="sm"
          variant="outline"
        >
          <span className="hidden sm:inline">Próxima</span>
          <HugeiconsIcon
            className="size-4"
            icon={ArrowRight01Icon}
            strokeWidth={2}
          />
        </Button>

        {showEdges ? (
          <Button
            aria-label="Última página"
            className="hidden sm:inline-flex"
            disabled={!hasNextPage}
            onClick={() => onPageChange(totalPages)}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon
              className="size-4"
              icon={ArrowRightDoubleIcon}
              strokeWidth={2}
            />
          </Button>
        ) : null}
      </div>

      {showLabel ? (
        <p className="text-xs text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
      ) : null}
    </nav>
  );
}
