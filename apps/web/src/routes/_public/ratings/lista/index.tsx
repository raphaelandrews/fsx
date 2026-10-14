import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChartIcon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { formatArchiveDate, RHYTHM_TABS } from "@/components/ratings-archive/format";
import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { ratingArchiveSearchSchema } from "@/lib/search-schemas";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_public/ratings/lista/")({
  validateSearch: ratingArchiveSearchSchema,
  search: { middlewares: [stripSearchParams({ ritmo: "rapid", page: 1 })] },
  loaderDeps: ({ search }) => ({ ritmo: search.ritmo }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(context.trpc.ratings.lists.queryOptions({ ratingType: deps.ritmo })),
  head: () =>
    buildSeo({
      title: withBrand("Listas de rating anteriores"),
      description: "Arquivo das listas de rating da Federação Sergipana de Xadrez, publicadas a cada atualização.",
      path: "/ratings/lista",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Ratings", path: "/ratings" },
        { name: "Listas anteriores", path: "/ratings/lista" },
      ]),
    }),
  pendingComponent: () => <CardGridSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { ritmo } = Route.useSearch();
  const { data } = useSuspenseQuery(trpc.ratings.lists.queryOptions({ ratingType: ritmo }));

  return (
    <>
      <PageHeader icon={BarChartIcon} title="Listas anteriores" description="A lista de rating de cada atualização, do dia em que foi publicada." />

      <Tabs className="mb-6 w-full" value={ritmo} onValueChange={(value) => navigate({ to: "/ratings/lista", search: { ritmo: value as typeof ritmo } })}>
        <div className="flex justify-center">
          <TabsList aria-label="Ritmo">
            {RHYTHM_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {data.dates.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Ainda não há listas anteriores neste ritmo.</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {data.dates.map((date) => (
              <li key={date}>
                <Link
                  to="/ratings/lista/$data"
                  params={{ data: date }}
                  search={{ ritmo }}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {formatArchiveDate(date)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-muted-foreground text-sm">
            O arquivo começa em {formatArchiveDate(data.dates[data.dates.length - 1]!)}, a primeira atualização registrada.
          </p>
        </>
      )}
    </>
  );
}
