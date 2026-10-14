import { Skeleton } from "@fsx/ui/components/skeleton"

import { PageHeaderSkeleton } from "./page-header-skeleton"

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden>
        <PageHeaderSkeleton />
        <Skeleton className="mb-3 h-6 w-32" />
        <div className="divide-y rounded-lg border border-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
