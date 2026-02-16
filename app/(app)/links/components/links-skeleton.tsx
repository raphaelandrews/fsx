import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"
import { Skeleton } from "@/components/ui/skeleton"

export function LinksSkeleton() {
  return (
    <section>
      <DottedX className="p-0">
        <div className="p-3">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>

        <DottedSeparator fullWidth />
        {/* Header Section */}
        <div className="p-4 flex justify-between items-center gap-4">
          <Skeleton className="h-5 w-24" />

          <div className="flex gap-2.5">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        {/* Link Groups */}
        {[1, 2, 3].map((groupIndex) => (
          <section className="mb-0" key={groupIndex}>
            {/* Announcement Skeleton */}
            <div className="flex items-center gap-2 p-4 border-t border-dashed">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="flex flex-col">
              {[1, 2, 3].map((linkIndex) => (
                <div key={linkIndex}>
                  <div className="m-1">
                    <div className="flex h-[56px] w-full items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                  {linkIndex < 2 && <DottedSeparator />}
                </div>
              ))}
            </div>
          </section>
        ))}
      </DottedX>
      <DottedSeparator />
    </section>
  )
}
