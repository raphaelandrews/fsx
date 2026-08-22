// NOTE: project-customized — kept in sync with `@fsx/ui/components/pagination`.
// This is the TanStack-Table variant of the pagination control: it accepts a
// `Table<TData>` (so it can read pagination state and wire onChange to
// TanStack's setters) and adds a rows-per-page Select. Visually it matches
// the server-side `Pagination` primitive — same control sizing, same smart
// truncation, same first/last/prev/next look — but lives at app level because
// it depends on TanStack's `Table` type.

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons"
import type { Table } from "@tanstack/react-table"

import { Button } from "@fsx/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select"
import { cn } from "@fsx/ui/lib/utils"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  /**
   * Options for the rows-per-page Select. Defaults match the `titled` admin
   * page (`[10, 20, 30, 40, 50]`); pass a custom array (e.g. the player
   * sheet's `[10, 15, 20, 25, 30, 40, 50]`) when you need different options.
   */
  pageSizeOptions?: number[]
  className?: string
}

type PageItem =
  | { type: "page"; page: number; isCurrent: boolean }
  | { type: "ellipsis"; key: "start" | "end" }

/**
 * Build the page-item sequence with smart truncation:
 *   1 … 4 5 [6] 7 8 … 23
 */
function buildPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PageItem[] {
  const totalNumbers = siblingCount * 2 + 5
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => ({
      type: "page" as const,
      page,
      isCurrent: page === currentPage,
    }))
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const showStartEllipsis = leftSibling > 2
  const showEndEllipsis = rightSibling < totalPages - 1

  const items: PageItem[] = []
  items.push({ type: "page", page: 1, isCurrent: currentPage === 1 })

  if (showStartEllipsis) {
    items.push({ type: "ellipsis", key: "start" })
  } else {
    for (let page = 2; page < leftSibling; page++) {
      items.push({ type: "page", page, isCurrent: page === currentPage })
    }
  }

  for (
    let page = leftSibling;
    page <= (showStartEllipsis ? Math.min(rightSibling, totalPages - 1) : rightSibling);
    page++
  ) {
    if (page === 1 || page === totalPages) continue
    items.push({ type: "page", page, isCurrent: page === currentPage })
  }

  if (showEndEllipsis) {
    items.push({ type: "ellipsis", key: "end" })
  } else {
    for (let page = rightSibling + 1; page < totalPages; page++) {
      items.push({ type: "page", page, isCurrent: page === currentPage })
    }
  }

  if (!items.some((item) => item.type === "page" && item.page === totalPages)) {
    items.push({ type: "page", page: totalPages, isCurrent: currentPage === totalPages })
  }

  return items
}

function PageButton({
  page,
  isCurrent,
  onPageChange,
}: {
  page: number
  isCurrent: boolean
  onPageChange: (page: number) => void
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
  )
}

function Ellipsis({ keyId }: { keyId: "start" | "end" }) {
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 items-center justify-center text-muted-foreground"
      data-ellipsis={keyId}
    >
      <HugeiconsIcon
        className="size-4"
        icon={MoreHorizontalCircle01Icon}
        strokeWidth={2}
      />
      <span className="sr-only">Mais páginas</span>
    </span>
  )
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
}: DataTablePaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount() || 1

  if (totalPages <= 1) return null

  const items = buildPageItems(currentPage, totalPages, 1)

  const goto = (page: number) => table.setPageIndex(page - 1)

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <label className="text-xs text-muted-foreground">
          Linhas por página
        </label>
        <Select
          onValueChange={(value) => table.setPageSize(Number(value))}
          value={`${table.getState().pagination.pageSize}`}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          aria-label="Primeira página"
          className="hidden sm:inline-flex"
          disabled={!table.getCanPreviousPage()}
          onClick={() => goto(1)}
          size="icon-sm"
          variant="ghost"
        >
          <HugeiconsIcon
            className="size-4"
            icon={ArrowLeftDoubleIcon}
            strokeWidth={2}
          />
        </Button>

        <Button
          aria-label="Página anterior"
          className="gap-1.5 px-2.5"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
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

        <div className="hidden items-center gap-1 sm:flex">
          {items.map((item) =>
            item.type === "ellipsis" ? (
              <Ellipsis key={`ellipsis-${item.key}`} keyId={item.key} />
            ) : (
              <PageButton
                key={item.page}
                isCurrent={item.isCurrent}
                page={item.page}
                onPageChange={goto}
              />
            )
          )}
        </div>

        <Button
          aria-label="Próxima página"
          className="gap-1.5 px-2.5"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
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

        <Button
          aria-label="Última página"
          className="hidden sm:inline-flex"
          disabled={!table.getCanNextPage()}
          onClick={() => goto(totalPages)}
          size="icon-sm"
          variant="ghost"
        >
          <HugeiconsIcon
            className="size-4"
            icon={ArrowRightDoubleIcon}
            strokeWidth={2}
          />
        </Button>
      </div>
    </nav>
  )
}
