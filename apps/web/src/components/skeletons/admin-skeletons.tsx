import { Skeleton } from "@fsx/ui/components/skeleton"

import { AdminPageHeaderSkeleton } from "./page-header-skeleton"
import { SkeletonFrame } from "./skeleton-frame"

export function AdminTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonFrame label="Loading…">
      <AdminPageHeaderSkeleton actions />
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-9 w-full sm:w-[250px]" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <div className="grid grid-cols-[4rem_1fr_6rem] gap-3 border-b bg-muted/40 p-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid grid-cols-[4rem_1fr_6rem] gap-3 border-b p-3 last:border-b-0">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
        </div>
        <Skeleton className="ml-auto h-8 w-64 max-w-full" />
      </div>
    </SkeletonFrame>
  )
}

export function AdminFormSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <SkeletonFrame label="Loading…">
      <AdminPageHeaderSkeleton back />
      <div className="divide-y">
        {Array.from({ length: sections }).map((_, i) => (
          <div key={i} className="grid gap-x-10 gap-y-4 py-6 first:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
    </SkeletonFrame>
  )
}
