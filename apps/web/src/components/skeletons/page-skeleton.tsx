import { Skeleton } from "@fsx/ui/components/skeleton"

// Neutral content placeholder used as the router default pending component.
// It renders inside whatever layout is already on screen (public or admin), so
// it stays padding-neutral and just fills the content area.
export function PageSkeleton() {
  return (
    <div className="w-full" role="status">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden className="space-y-6">
        <div className="flex flex-col items-center gap-3 py-2 sm:items-start">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
