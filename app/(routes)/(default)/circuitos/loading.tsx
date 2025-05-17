"use client";

import { Skeleton } from "@/components/ui/skeleton";
import Title from "@/components/ui/title";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen max-w-full max-h-full pb-20 pt-16">
       <Title label="Circuitos" />
        <div className="w-full h-full mt-8">
          <Skeleton className="w-full h-[40px] aspect-square rounded-xl" />
          <div className="flex flex-col gap-4 mt-6">
            <Skeleton className="h-[32px] aspect-square rounded-xl" />
            <Skeleton className="h-[32px] aspect-square rounded-xl" />
            <Skeleton className="h-[32px] aspect-square rounded-xl" />
            <Skeleton className="h-[32px] aspect-square rounded-xl" />
            <Skeleton className="h-[32px] aspect-square rounded-xl" />
            <Skeleton className="h-[32px] aspect-square rounded-xl" />
          </div>
        </div>
    </div>
  );
}

export default Loading;