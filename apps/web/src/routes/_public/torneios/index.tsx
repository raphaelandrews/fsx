import { createFileRoute, stripSearchParams, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Trophy } from "@hugeicons/core-free-icons";

import { Pagination } from "@/components/data-table/pagination";
import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { hasFilters, pageInput } from "@/components/torneios/labels";
import { TournamentFilters } from "@/components/torneios/tournament-filters";
import { TournamentTable } from "@/components/torneios/tournament-table";
import { tournamentsSearchSchema } from "@/lib/search-schemas";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_public/torneios/")({
  validateSearch: tournamentsSearchSchema,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(context.trpc.tournaments.page.queryOptions(pageInput(deps))),
      context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
    ]),
  head: ({ match }) => {
    const search = match.search;
    // Filtered views canonicalize to the archive itself; page n of the full list is its own canonical.
    const path = hasFilters(search) ? "/torneios" : search.page > 1 ? `/torneios?page=${search.page}` : "/torneios";
    return buildSeo({
      title: withBrand(search.page > 1 ? `Torneios — Página ${search.page}` : "Torneios"),
      description: "Arquivo dos torneios da Federação Sergipana de Xadrez: campeões, classificação e variação de rating de cada edição.",
      path,
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Torneios", path: "/torneios" },
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
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(trpc.tournaments.page.queryOptions(pageInput(search)));
  const { data: championships } = useSuspenseQuery(trpc.champions.list.queryOptions());

  return (
    <>
      <PageHeader
        icon={Trophy}
        title="Torneios"
        description="Todas as edições dos torneios da Federação Sergipana de Xadrez, com campeões e resultados."
      />

      <TournamentFilters
        search={search}
        years={data.years}
        championships={championships}
        onChange={(patch) => navigate({ to: "/torneios", search: { ...search, ...patch, page: 1 } })}
        onClear={() => navigate({ to: "/torneios", search: {} })}
      />

      {data.tournaments.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhum torneio encontrado com esses filtros.</p>
      ) : (
        <TournamentTable tournaments={data.tournaments} />
      )}

      <div className="mt-6">
        <Pagination
          currentPage={data.pagination.currentPage}
          hasNextPage={data.pagination.hasNextPage}
          hasPreviousPage={data.pagination.hasPreviousPage}
          totalPages={data.pagination.totalPages}
          onPageChange={(page) => navigate({ to: "/torneios", search: { ...search, page } })}
          onPagePreload={(page) => void router.preloadRoute({ to: "/torneios", search: { ...search, page } })}
          getPageHref={(page) => router.buildLocation({ to: "/torneios", search: { ...search, page } }).href}
        />
      </div>
    </>
  );
}
