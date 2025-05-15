import { Skeleton } from "@/components/ui/skeleton";

export function DataTableToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col md:flex-row flex-1 items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
        <Skeleton className="h-8 w-[150px] lg:w-[250px]" />

        <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[90px]" />
        </div>
      </div>
    </div>
  );
}
