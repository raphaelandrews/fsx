import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="w-11/12 max-w-[500px] m-auto pt-30 pb-20 animate-pulse">
      <div className="mb-12">
        <Skeleton className="w-full h-32 rounded-md" />
        <Skeleton className="absolute w-20 h-20 rounded-[10px] border-4 border-background left-1/2 -translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="flex justify-center items-center">
        <Skeleton className="h-7 w-40" />
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mt-8">
        <Skeleton className="w-10 h-10 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <Skeleton className="h-4 w-20 mb-1 rounded" />
          <Skeleton className="h-5 w-48 rounded" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-1 rounded" />
          <Skeleton className="h-5 w-32 rounded" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-1 rounded" />
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-1 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
      </div>

      <div className="mt-3">
        <Skeleton className="h-4 w-20 mb-2 rounded" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
        </div>
        <Skeleton className="h-4 w-12 mt-4 mb-2 rounded" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
        </div>
      </div>

      <div className="mt-4">
        <Skeleton className="h-4 w-28 mb-1 rounded" />
        <Skeleton className="h-3 w-32 mb-2 rounded" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 mt-2" />
        </div>
        <div className="mt-2 space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>

      <div className="mt-3">
        <Skeleton className="h-4 w-24 mb-2 rounded" />
        <Skeleton className="h-64 w-full" />
      </div>
    </section>
  );
}
