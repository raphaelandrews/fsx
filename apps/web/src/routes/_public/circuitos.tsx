import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { CircuitView } from "@/components/circuitos/circuit-view";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useTRPC } from "@/utils/trpc";
import { slugify } from "@/utils/slugify";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";

const searchSchema = z.object({
  circuito: z.string().optional(),
});

export const Route = createFileRoute("/_public/circuitos")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ circuito: search.circuito }),
  loader: async ({ context, deps }) => {
    const circuits = await context.queryClient.ensureQueryData(
      context.trpc.circuits.listSimple.queryOptions(),
    );
    const circuit = deps.circuito
      ? circuits.find((item) => slugify(item.name) === deps.circuito)
      : circuits[0];
    if (circuit) {
      await context.queryClient.ensureQueryData(
        context.trpc.circuits.byId.queryOptions({ id: circuit.id }),
      );
    }
    return { circuits, selectedId: circuit?.id };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return buildSeo({
        title: withBrand("Circuitos"),
        description: "Classificação e resultados dos circuitos de torneios da Federação Sergipana de Xadrez.",
        path: "/circuitos",
      });
    }
    const circuit = loaderData.selectedId
      ? loaderData.circuits.find((item) => item.id === loaderData.selectedId)
      : loaderData.circuits[0];
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
  const { circuito } = Route.useSearch();
  const selectedId = Route.useLoaderData().selectedId;

  const activeSlug = circuito ?? (circuits[0] ? slugify(circuits[0].name) : "");
  const activeCircuit = circuits.find((c) => c.id === selectedId) ??
    circuits.find((c) => slugify(c.name) === activeSlug) ??
    circuits[0];

  return (
    <>
      <PageHeader
        description="Classificação e resultados dos circuitos da Federação Sergipana de Xadrez."
        title="Circuitos"
      />

      {circuits.length === 0 ? (
        <p className="text-muted-foreground">Nenhum circuito cadastrado.</p>
      ) : (
        <>
          <Tabs
            value={activeSlug}
            onValueChange={(value) => navigate({ to: "/circuitos", search: { circuito: value } })}
            className="mb-6 w-full"
          >
            <div className="flex w-full justify-center overflow-x-auto">
              <TabsList className="overflow-x-auto">
                {circuits.map((circuit) => (
                  <TabsTrigger key={circuit.name} value={slugify(circuit.name)}>
                    {circuit.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {activeCircuit && <CircuitDetail key={activeCircuit.id} id={activeCircuit.id} />}
        </>
      )}
    </>
  );
}

function CircuitDetail({ id }: { id: number }) {
  const trpc = useTRPC();
  const { data: circuit } = useSuspenseQuery(trpc.circuits.byId.queryOptions({ id }));
  return circuit ? <CircuitView circuit={circuit} /> : null;
}
