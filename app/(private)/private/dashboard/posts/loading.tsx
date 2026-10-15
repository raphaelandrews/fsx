import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Title Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-full max-w-sm" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
