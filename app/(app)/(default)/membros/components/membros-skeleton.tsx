import { Skeleton } from "@/components/ui/skeleton";
import { DottedSeparator } from "@/components/dotted-separator";
import { Announcement } from "@/components/announcement";
import { Briefcase, Flag } from "lucide-react";

export function MembrosSkeleton() {
  return (
    <>
      <section className="mb-0">
        <Announcement icon={Briefcase} label="Diretoria" className="text-sm" />

        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, index) => (
            <MemberCardSkeleton key={`management-skeleton-${index}`} isLast={index === 4} />
          ))}
        </div>

        <DottedSeparator />
      </section>

      <section className="mb-0">
        <Announcement icon={Flag} label="Árbitros" className="text-sm" />

        <div className="flex flex-col">
          {Array.from({ length: 3 }).map((_, groupIndex) => (
            <div key={`referee-group-skeleton-${groupIndex}`}>
              <Announcement label="Carregando..." className="text-xs w-32" />
              <div className="flex flex-col">
                {Array.from({ length: 3 }).map((_, index) => (
                  <MemberCardSkeleton
                    key={`referee-skeleton-${groupIndex}-${index}`}
                    isLast={index === 2}
                  />
                ))}
              </div>
              {groupIndex !== 2 && <DottedSeparator className="w-full" />}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function MemberCardSkeleton({ isLast }: { isLast: boolean }) {
  return (
    <div>
      <div className="m-1">
        <div className="flex items-center justify-between p-3 select-none">
          <div className="flex items-center gap-4 w-full">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-1 w-full max-w-[200px]">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </div>
      {!isLast && <DottedSeparator className="w-full" />}
    </div>
  );
}
