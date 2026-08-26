import { Skeleton } from "@fsx/ui/components/skeleton"

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 8, cols = 5 }: TableSkeletonProps) {
  const gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`

  return (
    <div className="pt-8 pb-6 sm:pt-12" role="status">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden className="space-y-4">
        <div className="flex flex-col items-center gap-3 pb-2">
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <div
            className="grid gap-2 border-b bg-muted/40 p-3"
            style={{ gridTemplateColumns }}
          >
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, row) => (
            <div
              key={row}
              className="grid gap-2 border-b p-3 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              {Array.from({ length: cols }).map((_, col) => (
                <Skeleton key={col} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
