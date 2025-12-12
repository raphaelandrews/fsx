"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function NewsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 12 }, (_, i) => `news-skeleton-${i}`).map((id) => (
        <div key={id}>
          <Skeleton className="aspect-[2/1] w-full" />
          <Skeleton className="mt-2 mb-1 h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ))}
    </div>
  );
}
