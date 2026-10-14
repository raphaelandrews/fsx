import { Skeleton } from "@fsx/ui/components/skeleton"

export function ArticleSkeleton({ cover = true }: { cover?: boolean }) {
  return (
    <div role="status" className="mx-auto max-w-3xl pt-8 sm:pt-12">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-48" />
        </div>
        {cover ? <Skeleton className="aspect-video w-full rounded-lg" /> : null}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={i % 4 === 3 ? "h-4 w-2/3" : "h-4 w-full"} />
          ))}
        </div>
      </div>
    </div>
  )
}
