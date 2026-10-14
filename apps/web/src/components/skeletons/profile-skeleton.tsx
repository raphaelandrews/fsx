import { Skeleton } from "@fsx/ui/components/skeleton"

import { SkeletonFrame } from "./skeleton-frame"

export function ProfileSkeleton() {
  return (
    <SkeletonFrame className="pt-8 sm:pt-12" contentClassName="space-y-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Skeleton className="size-28 shrink-0 rounded-full" />
        <div className="w-full space-y-3">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </SkeletonFrame>
  )
}
