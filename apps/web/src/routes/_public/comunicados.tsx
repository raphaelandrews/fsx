import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ScrollIcon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { z } from "zod";

import { Pagination } from "@/components/data-table/pagination";

import { DottedSeparator } from "@/components/dotted-separator";
import { AnnouncementsModal } from "@/components/modals/announcements-modal";
import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { useTRPC } from "@/utils/trpc";
import { padNumber } from "@/utils/format";

const searchSchema = z.object({
  page: z.number().int().positive().default(1),
});

export const Route = createFileRoute("/_public/comunicados")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Comunicados - FSX" },
      { name: "description", content: "Comunicados oficiais da Federação Sergipana de Xadrez" },
    ],
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.announcements.byPage.queryOptions({ page: deps.page }),
    ),
  pendingComponent: () => <CardGridSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { page } = Route.useSearch();
  const { data } = useSuspenseQuery(trpc.announcements.byPage.queryOptions({ page }));

  return (
    <>
      <PageHeader
        description="Avisos e comunicados oficiais da Federação Sergipana de Xadrez."
        title="Comunicados"
      />

      {data.announcements.length === 0 ? (
        <p className="text-muted-foreground">Nenhum comunicado publicado.</p>
      ) : (
        <div className="flex flex-col">
          {data.announcements.map((announcement, index) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              isLast={index === data.announcements.length - 1}
            />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={data.pagination.currentPage}
          hasNextPage={data.pagination.hasNextPage}
          hasPreviousPage={data.pagination.hasPreviousPage}
          onPageChange={(newPage) => navigate({ to: "/comunicados", search: { page: newPage } })}
          totalPages={data.pagination.totalPages}
        />
      </div>
    </>
  );
}

function AnnouncementRow({
  announcement,
  isLast,
}: {
  announcement: { id: number; year: number; number: number; content: string };
  isLast: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div className="m-1">
        <AnnouncementsModal
          content={announcement.content}
          number={padNumber(announcement.number)}
          onOpenChange={setIsOpen}
          open={isOpen}
          trigger={
            <button
              className="group flex w-full cursor-pointer items-center justify-between p-3 text-left transition-colors duration-300 select-none hover:bg-muted/50"
              type="button"
            >
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon className="size-3.5 text-muted-foreground" icon={ScrollIcon} />
                    <h3 className="text-sm leading-tight font-bold">
                      Comunicado {padNumber(announcement.number)}/{announcement.year}
                    </h3>
                  </div>
                  <div className="text-muted-foreground transition-colors group-hover:text-foreground">
                    <HugeiconsIcon className="size-3.5" icon={ArrowUpRight01Icon} />
                  </div>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{announcement.content}</p>
              </div>
            </button>
          }
          year={announcement.year}
        />
      </div>
      {!isLast && <DottedSeparator className="w-full" />}
    </div>
  );
}
