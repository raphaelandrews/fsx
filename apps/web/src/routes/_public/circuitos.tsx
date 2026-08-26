import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

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
    const circuit = activeSlug
      ? circuits.find((c) => slugify(c.name) === activeSlug)
      : circuits[0];
    return {
      meta: [
        { title: circuit ? `${circuit.name} - Circuitos - FSX` : "Circuitos - FSX" },
        { name: "description", content: "Circuitos de torneios da Federação Sergipana de Xadrez" },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.circuits.list.queryOptions()),
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
      <PageHeader title="Circuitos" />

      {circuits.length === 0 ? (
        <p className="text-muted-foreground">Nenhum circuito cadastrado.</p>
      ) : (
        <>
          <Tabs
            value={activeSlug}
            onValueChange={(value) => navigate({ to: "/circuitos", search: { circuito: value } })}
            className="w-full"
          >
            <div className="mb-6 flex w-full justify-center overflow-x-auto">
              <TabsList className="overflow-x-auto">
                {circuits.map((circuit) => (
                  <TabsTrigger key={circuit.name} value={slugify(circuit.name)}>
                    {circuit.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {activeCircuit && (
            <div className="space-y-6">
              {activeCircuit.circuitPhases.map((phase) => (
                <section key={phase.id} className="rounded-md border">
                  <h2 className="border-b bg-muted/50 px-4 py-2 text-sm font-semibold">
                    {phase.tournament?.name ?? `Etapa ${phase.sortOrder}`}
                  </h2>
                  {phase.circuitPodiums.length === 0 ? (
                    <p className="px-4 py-3 text-muted-foreground text-sm">Sem resultados.</p>
                  ) : (
                    <ul className="divide-y">
                      {phase.circuitPodiums.map((podium, index) => (
                        <li
                          key={`${podium.player?.id ?? index}-${podium.place ?? "unranked"}`}
                          className="flex items-center justify-between px-4 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground tabular-nums w-6">
                              {podium.place != null ? `${podium.place}º` : "—"}
                            </span>
                            <span className="font-medium">
                              {podium.player?.nickname ?? podium.player?.name ?? "—"}
                            </span>
                            {podium.category && (
                              <span className="text-muted-foreground text-xs">{podium.category}</span>
                            )}
                          </span>
                          <span className="font-semibold tabular-nums">{podium.points} pts</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
