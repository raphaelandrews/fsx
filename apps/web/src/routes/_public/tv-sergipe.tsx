import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { TvSergipeView } from "@/components/tv-sergipe/tv-sergipe-view";
import {
  resolveTvSergipeFilters,
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
    view: search.view,
    idade: search.idade,
    escopo: search.escopo,
  }),
  loader: ({ context, deps }) => {
    // List is always needed — it's the source of the drilldown data.
    const listPromise = context.queryClient.ensureQueryData(tvSergipeListOptions(context.trpc));

    const filters = resolveTvSergipeFilters({ idade: deps.idade, escopo: deps.escopo });

    return Promise.all([
      listPromise,
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
