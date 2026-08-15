import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ScrollIcon } from "@hugeicons/core-free-icons";
import { z } from "zod";

import { buttonVariants } from "@fsx/ui/components/button";

import { AnnouncementsModal } from "@/components/modals/announcements-modal";
import { useTRPC } from "@/utils/trpc";

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
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { page } = Route.useSearch();
  const { data } = useSuspenseQuery(trpc.announcements.byPage.queryOptions({ page }));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Comunicados</h1>

      {data.announcements.length === 0 ? (
        <p className="text-muted-foreground">Nenhum comunicado publicado.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {data.announcements.map((announcement) => (
            <AnnouncementRow key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-2">
        {data.pagination.hasPreviousPage && (
          <Link
            to="/comunicados"
            search={{ page: data.pagination.currentPage - 1 }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Anterior
          </Link>
        )}
        <span className="text-xs text-muted-foreground">
          Página {data.pagination.currentPage} de {data.pagination.totalPages}
        </span>
        {data.pagination.hasNextPage && (
          <Link
            to="/comunicados"
            search={{ page: data.pagination.currentPage + 1 }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}

function AnnouncementRow({
  announcement,
}: {
  announcement: { id: number; year: number; number: number; content: string };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/50"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={ScrollIcon} size={14} className="text-muted-foreground" />
          <span className="font-semibold text-sm">
            Comunicado {announcement.number}/{announcement.year}
          </span>
        </div>
        <span className="line-clamp-1 text-muted-foreground text-sm">{announcement.content}</span>
      </button>
      <AnnouncementsModal
        content={announcement.content}
        number={String(announcement.number)}
        onOpenChange={setIsOpen}
        open={isOpen}
        year={announcement.year}
      />
    </>
  );
}
