import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export function BulletSkeleton() {
  return (
    <>
      <section>
        <div className="py-8 md:py-12 md:pb-8">
          <Skeleton className="h-7 w-64" />
          <Separator className="mt-1" />
        </div>
        <div className="md:flex md:flex-row-reverse justify-between items-start gap-8">
          {/* Info Card Skeleton */}
          <div className="w-full md:w-[320px] shrink-0 border rounded-lg p-4 space-y-4">
            <Skeleton className="aspect-square w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="mt-6 md:mt-0 flex-1">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
            </div>

            <div className="mt-6">
              <Skeleton className="h-7 w-32" />
              <Separator className="mt-1" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            </div>

            <div className="mt-6">
              <Skeleton className="h-7 w-32" />
              <Separator className="mt-1" />
              <div className="mt-4 border rounded-md">
                <div className="p-4 border-b">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
