import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { CircuitView } from "@/components/circuitos/circuit-view";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useTRPC } from "@/utils/trpc";
import { slugify } from "@/utils/slugify";

const searchSchema = z.object({
  circuito: z.string().optional(),
});

export const Route = createFileRoute("/_public/circuitos")({
  validateSearch: searchSchema,
  head: ({ loaderData, match }) => {
    const circuits = (loaderData ?? []) as Array<{ name: string }>;
    const activeSlug = match.search?.circuito;
    const circuit = activeSlug ? circuits.find((c) => slugify(c.name) === activeSlug) : circuits[0];
    return {
      meta: [
        { title: circuit ? `${circuit.name} - Circuitos - FSX` : "Circuitos - FSX" },
        { name: "description", content: "Circuitos de torneios da Federação Sergipana de Xadrez" },
      ],
    };
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.circuits.list.queryOptions()),
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: circuits = [] } = useSuspenseQuery(trpc.circuits.list.queryOptions());
  const { circuito } = Route.useSearch();

  const activeSlug = circuito ?? (circuits[0] ? slugify(circuits[0].name) : "");
  const activeCircuit = circuits.find((c) => slugify(c.name) === activeSlug) ?? circuits[0];

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

          {activeCircuit && <CircuitView circuit={activeCircuit} />}
        </>
      )}
    </>
  );
}
