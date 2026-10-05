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

import { buildPageItems } from "./page-items"
import { useTableText } from "@/lib/table-text"

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
      className={cn("h-8 w-8 p-0 text-base", isCurrent && "pointer-events-none")}
      onClick={() => onPageChange(page)}
      size="sm"
      variant={isCurrent ? "default" : "outline"}
    >
      {page}
    </Button>
  )
}

function Ellipsis({ keyId }: { keyId: "start" | "end" }) {
  const text = useTableText()
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
      <span className="sr-only">{text.morePages}</span>
    </span>
  )
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
}: DataTablePaginationProps<TData>) {
  const text = useTableText()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount() || 1

  if (totalPages <= 1) return null

  const items = buildPageItems(currentPage, totalPages, 1)

  const goto = (page: number) => table.setPageIndex(page - 1)
  const renderItems = (list: typeof items) =>
    list.map((item) =>
      item.type === "ellipsis" ? (
        <Ellipsis key={`ellipsis-${item.key}`} keyId={item.key} />
      ) : (
        <PageButton key={item.page} isCurrent={item.isCurrent} page={item.page} onPageChange={goto} />
      )
    )

  return (
    <nav
      aria-label={text.pagination}
      className={cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <label className="text-sm text-muted-foreground">
          {text.rowsPerPage}
        </label>
        <Select
          onValueChange={(value) => table.setPageSize(Number(value))}
          value={`${table.getState().pagination.pageSize}`}
        >
          <SelectTrigger className="h-8 w-[70px]" aria-label={text.rowsPerPage}>
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
          aria-label={text.firstPage}
          className="hidden sm:inline-flex"
          disabled={!table.getCanPreviousPage()}
          onClick={() => goto(1)}
          size="icon"
          variant="ghost"
        >
          <HugeiconsIcon
            className="size-4"
            icon={ArrowLeftDoubleIcon}
            strokeWidth={2}
          />
        </Button>

        <Button
          aria-label={text.previousPage}
          className="gap-1.5 px-2.5"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="default"
          variant="outline"
        >
          <HugeiconsIcon
            className="size-4"
            icon={ArrowLeft01Icon}
            strokeWidth={2}
          />
          <span className="hidden sm:inline">{text.previous}</span>
        </Button>

        <div className="hidden items-center gap-1 sm:flex">{renderItems(items)}</div>

        <Button
          aria-label={text.nextPage}
          className="gap-1.5 px-2.5"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="default"
          variant="outline"
        >
          <span className="hidden sm:inline">{text.next}</span>
          <HugeiconsIcon
            className="size-4"
            icon={ArrowRight01Icon}
            strokeWidth={2}
          />
        </Button>

        <Button
          aria-label={text.lastPage}
          className="hidden sm:inline-flex"
          disabled={!table.getCanNextPage()}
          onClick={() => goto(totalPages)}
          size="icon"
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
