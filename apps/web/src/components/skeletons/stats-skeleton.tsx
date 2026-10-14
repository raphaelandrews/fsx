import { Skeleton } from "@fsx/ui/components/skeleton"

import { PageHeaderSkeleton } from "./page-header-skeleton"

export function StatsSkeleton({ tiles = 8 }: { tiles?: number }) {
  return (
    <div role="status">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden>
        <PageHeaderSkeleton />
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-32 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: tiles }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-10 h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}
