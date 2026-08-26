import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ScrollIcon } from "@hugeicons/core-free-icons";
import { z } from "zod";

import { Pagination } from "@/components/data-table/pagination";

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
    context.queryClient.ensureQueryData(context.trpc.announcements.byPage.queryOptions({ page: deps.page })),
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
      <PageHeader title="Comunicados" />

      {data.announcements.length === 0 ? (
        <p className="text-muted-foreground">Nenhum comunicado publicado.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {data.announcements.map((announcement) => (
            <AnnouncementRow key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={data.pagination.currentPage}
          hasNextPage={data.pagination.hasNextPage}
          hasPreviousPage={data.pagination.hasPreviousPage}
          totalPages={data.pagination.totalPages}
          onPageChange={(newPage) =>
            navigate({ to: "/comunicados", search: { page: newPage } })
          }
        />
      </div>
    </>
  );
}

function AnnouncementRow({
  announcement,
}: {
  announcement: { id: number; year: number; number: number; content: string };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AnnouncementsModal
      content={announcement.content}
      number={padNumber(announcement.number)}
      onOpenChange={setIsOpen}
      open={isOpen}
      trigger={
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={ScrollIcon} size={14} className="text-muted-foreground" />
            <span className="font-semibold text-sm">
              Comunicado {padNumber(announcement.number)}/{announcement.year}
            </span>
          </div>
          <span className="line-clamp-1 text-muted-foreground text-sm">{announcement.content}</span>
        </button>
      }
      year={announcement.year}
    />
  );
}
