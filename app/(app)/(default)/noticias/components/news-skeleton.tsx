import { Fragment } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DottedSeparator } from "@/components/dotted-separator";

export function NewsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-0 relative">
          <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 z-0 hidden sm:block">
            <DottedSeparator vertical />
          </div>
          {Array.from({ length: 12 }).map((_, index) => (
            <Fragment key={index}>
              <div className="p-3">
                <div className="p-[4px] rounded-[10px] border border-border mb-2">
                  <Skeleton className="aspect-[2/1] w-full rounded-md" />
                </div>
                <div className="px-2 flex flex-col gap-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              {(index + 1) % 2 === 0 && index < 11 && (
                <div className="col-span-full hidden sm:block">
                  <DottedSeparator />
                </div>
              )}
              {index < 11 && (
                <div className="col-span-full sm:hidden">
                  <DottedSeparator />
                </div>
              )}
            </Fragment>
          ))}
    </div>
  );
}
