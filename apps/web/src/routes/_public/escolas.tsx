import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { EscolasView } from "@/components/escolas/escolas-view";
import { AGE_GROUPS, subScopeToFilters, type SubScopeId } from "@/components/escolas/constants";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

const searchSchema = z.object({
  view: z.enum(["medals", "points"]).default("medals"),
  idade: z.enum(AGE_GROUPS).optional(),
  escopo: z
    .enum([
      "geral",
      "male-individual",
      "female-individual",
      "male-team",
      "female-team",
      "male-all",
      "female-all",
    ])
    .optional(),
});

export const Route = createFileRoute("/_public/escolas")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Jogos Escolares TV Sergipe - FSX" },
      {
        name: "description",
        content:
          "Classificação por escola nos Jogos Escolares TV Sergipe — medalhas e pontos por idade, sexo e modalidade.",
      },
    ],
  }),
  loaderDeps: ({ search }) => ({
    view: search.view,
    idade: search.idade,
    escopo: search.escopo,
  }),
  loader: ({ context, deps }) => {
    // List is always needed — it's the source of the drilldown data.
    const listPromise = context.queryClient.ensureQueryData(
      context.trpc.schoolResults.list.queryOptions(),
    );

    const filters = deps.idade ? subScopeToFilters((deps.escopo ?? "geral") as SubScopeId) : {};

    return Promise.all([
      listPromise,
      context.queryClient.ensureQueryData(
        context.trpc.schoolResults.leaderboard.queryOptions({
          ageGroup: deps.idade,
          sex: filters.sex,
          modality: filters.modality,
        }),
      ),
    ]);
  },
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Jogos Escolares TV Sergipe"
        description="Classificação por escola nos Jogos Escolares TV Sergipe — medalhas e pontos por idade, sexo e modalidade."
      />
      <EscolasView />
    </>
  );
}
