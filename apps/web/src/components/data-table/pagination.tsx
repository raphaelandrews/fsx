import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@fsx/ui/components/button"
import { cn } from "@fsx/ui/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
  showLabel?: boolean
  showEdges?: boolean
  siblingCount?: number
  className?: string
}

type PageItem =
  | { type: "page"; page: number; isCurrent: boolean }
  | { type: "ellipsis"; key: "start" | "end" }

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
  if (totalPages <= 1) return null

  const items = buildPageItems(currentPage, totalPages, siblingCount)

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
  )
}
