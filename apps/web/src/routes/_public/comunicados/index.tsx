import { createFileRoute, useNavigate, useRouter, stripSearchParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Megaphone01Icon } from "@hugeicons/core-free-icons";
import { z } from "zod";

import { AnnouncementRow } from "@/components/announcement-row";
import { Pagination } from "@/components/data-table/pagination";

import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { useTRPC } from "@/utils/trpc";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";

const searchSchema = z.object({
  page: z.number().int().positive().max(1_000).default(1),
});

export const Route = createFileRoute("/_public/comunicados/")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.announcements.byPage.queryOptions({ page: deps.page }),
    ),
  head: ({ loaderData }) => {
    const page = loaderData?.pagination.currentPage ?? 1;
    return buildSeo({
      title: page > 1 ? withBrand(`Comunicados — Página ${page}`) : withBrand("Comunicados"),
      description: "Comunicados e avisos oficiais da Federação Sergipana de Xadrez.",
      path: page > 1 ? `/comunicados?page=${page}` : "/comunicados",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Comunicados", path: "/comunicados" },
      ]),
    });
  },
  pendingComponent: () => <CardGridSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const router = useRouter();
  const { page } = Route.useSearch();
  const { data } = useSuspenseQuery(trpc.announcements.byPage.queryOptions({ page }));

  return (
    <>
      <PageHeader icon={Megaphone01Icon}
        description="Avisos e comunicados oficiais da Federação Sergipana de Xadrez."
        title="Comunicados"
      />

      {data.announcements.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhum comunicado publicado.</p>
      ) : (
        <ul className="grid md:grid-cols-2">
          {data.announcements.map((announcement) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={{ ...announcement, excerpt: announcement.content }}
            />
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={data.pagination.currentPage}
          hasNextPage={data.pagination.hasNextPage}
          hasPreviousPage={data.pagination.hasPreviousPage}
          onPageChange={(newPage) => navigate({ to: "/comunicados", search: { page: newPage } })}
          onPagePreload={(page) => void router.preloadRoute({ to: "/comunicados", search: { page } })}
          getPageHref={(page) => router.buildLocation({ to: "/comunicados", search: { page } }).href}
          totalPages={data.pagination.totalPages}
        />
      </div>
    </>
  );
}
