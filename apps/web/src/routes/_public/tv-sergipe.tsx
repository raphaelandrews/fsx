import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { TvSergipeView } from "@/components/tv-sergipe/tv-sergipe-view";
import {
  resolveTvSergipeFilters,
  tvSergipeEditionsOptions,
  tvSergipeLeaderboardOptions,
  tvSergipeListOptions,
} from "@/components/tv-sergipe/queries";
import { SchoolIcon } from "@hugeicons/core-free-icons";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { tvSergipeSearchSchema } from "@/lib/search-schemas";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";


export const Route = createFileRoute("/_public/tv-sergipe")({
  validateSearch: tvSergipeSearchSchema,
  search: { middlewares: [stripSearchParams({ view: "medals" })] },
  head: () =>
    buildSeo({
      title: withBrand("Jogos Escolares TV Sergipe"),
      description:
        "Classificação por escola nos Jogos Escolares TV Sergipe — medalhas e pontos por idade, sexo e modalidade.",
      path: "/tv-sergipe",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "TV Sergipe", path: "/tv-sergipe" },
      ]),
    }),
  loaderDeps: ({ search }) => ({
    edicao: search.edicao,
    view: search.view,
    idade: search.idade,
    escopo: search.escopo,
  }),
  loader: async ({ context, deps }) => {
    const editions = await context.queryClient.ensureQueryData(tvSergipeEditionsOptions(context.trpc));
    const tournamentId = deps.edicao ?? editions[0]?.id;
    const filters = resolveTvSergipeFilters({ tournamentId, idade: deps.idade, escopo: deps.escopo });

    // The list is always needed: it is the source of the drilldown data.
    return Promise.all([
      context.queryClient.ensureQueryData(tvSergipeListOptions(context.trpc, tournamentId)),
      context.queryClient.ensureQueryData(tvSergipeLeaderboardOptions(context.trpc, filters)),
    ]);
  },
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader icon={SchoolIcon}
        title="Jogos Escolares TV Sergipe"
        description="Classificação por escola nos Jogos Escolares TV Sergipe — medalhas e pontos por idade, sexo e modalidade."
      />
      <TvSergipeView />
    </>
  );
}
