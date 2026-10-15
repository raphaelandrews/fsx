import { Skeleton } from "@fsx/ui/components/skeleton"

/** Same box as `PageHeader`: icon circle, title and an optional description. */
export function PageHeaderSkeleton({ description = true }: { description?: boolean }) {
  return (
    <div className="flex flex-col items-center pt-8 pb-6 text-center sm:pt-12 sm:pb-8">
      <Skeleton className="mb-4 size-11 rounded-full" />
      <Skeleton className="h-9 w-48 sm:h-10" />
      {description ? <Skeleton className="mt-3 h-5 w-full max-w-md" /> : null}
    </div>
  )
}

/** Same box as `AdminPageHeader`. */
export function AdminPageHeaderSkeleton({ actions = false, back = false }: { actions?: boolean; back?: boolean }) {
  return (
    <div className="mb-6 border-b pb-4">
      {back ? <Skeleton className="mb-3 h-4 w-20" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        {actions ? <Skeleton className="h-9 w-28" /> : null}
      </div>
    </div>
  )
}
