import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fsx/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { CircuitChampions, CircuitStatus } from "@/components/circuitos/circuit-champions";
import { CircuitView } from "@/components/circuitos/circuit-view";
import { selectSeason } from "@/components/circuitos/season";
import { Medal01Icon } from "@hugeicons/core-free-icons";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useTRPC } from "@/utils/trpc";
import { slugify } from "@/utils/slugify";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";

const searchSchema = z.object({
  ano: z.number().int().optional().catch(undefined),
  circuito: z.string().optional(),
});

export const Route = createFileRoute("/_public/circuitos")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ ano: search.ano, circuito: search.circuito }),
  loader: async ({ context, deps }) => {
    const circuits = await context.queryClient.ensureQueryData(
      context.trpc.circuits.listSimple.queryOptions(),
    );
    const { selected } = selectSeason(circuits, deps);
    if (selected) {
      await context.queryClient.ensureQueryData(
        context.trpc.circuits.byId.queryOptions({ id: selected.id }),
      );
    }
    return { circuits, selectedId: selected?.id };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return buildSeo({
        title: withBrand("Circuitos"),
        description: "Classificação e resultados dos circuitos de torneios da Federação Sergipana de Xadrez.",
        path: "/circuitos",
      });
    }
    const circuit = loaderData.circuits.find((item) => item.id === loaderData.selectedId);
    return buildSeo({
      title: circuit ? withBrand(`${circuit.name} — Circuitos`) : withBrand("Circuitos"),
      description: circuit
        ? `Classificação e resultados do ${circuit.name}, circuito de torneios da Federação Sergipana de Xadrez.`
        : "Classificação e resultados dos circuitos de torneios da Federação Sergipana de Xadrez.",
      path: "/circuitos",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Circuitos", path: "/circuitos" },
      ]),
    });
  },
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: circuits = [] } = useSuspenseQuery(trpc.circuits.listSimple.queryOptions());
  const search = Route.useSearch();
  const { years, year, season, selected } = selectSeason(circuits, search);

  return (
    <>
      <PageHeader icon={Medal01Icon}
        description="Classificação e resultados dos circuitos da Federação Sergipana de Xadrez."
        title="Circuitos"
      />

      {circuits.length === 0 ? (
        <p className="text-muted-foreground">Nenhum circuito cadastrado.</p>
      ) : (
        <>
          <div className="mb-6 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {years.length > 1 && year !== undefined && (
              <Select
                value={String(year)}
                onValueChange={(value) => value && navigate({ to: "/circuitos", search: { ano: Number(value) } })}
              >
                <SelectTrigger className="h-8 w-[110px] text-sm" aria-label="Temporada">
                  <SelectValue>{(value) => value as string}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {years.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Tabs
              value={selected ? slugify(selected.name) : ""}
              onValueChange={(value) => navigate({ to: "/circuitos", search: { ano: year, circuito: value } })}
              className="w-full min-w-0 sm:w-auto"
            >
              <div className="flex w-full justify-center overflow-x-auto">
                <TabsList className="overflow-x-auto">
                  {season.map((circuit) => (
                    <TabsTrigger key={circuit.id} value={slugify(circuit.name)}>
                      {circuit.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {selected && <CircuitDetail key={selected.id} id={selected.id} />}
        </>
      )}
    </>
  );
}

function CircuitDetail({ id }: { id: number }) {
  const trpc = useTRPC();
  const { data: circuit } = useSuspenseQuery(trpc.circuits.byId.queryOptions({ id }));
  return (
    <>
      <CircuitStatus circuit={circuit} />
      <CircuitChampions circuit={circuit} />
      <CircuitView circuit={circuit} />
    </>
  );
}
