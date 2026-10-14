import { Skeleton } from "@fsx/ui/components/skeleton"

import { PageHeaderSkeleton } from "./page-header-skeleton"

interface CardGridSkeletonProps {
  cards?: number
}

export function CardGridSkeleton({ cards = 9 }: CardGridSkeletonProps) {
  return (
    <div role="status">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden>
        <PageHeaderSkeleton />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <Skeleton className="aspect-video w-full rounded-md" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
