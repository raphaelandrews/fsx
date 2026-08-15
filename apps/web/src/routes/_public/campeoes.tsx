import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/campeoes")({
  head: () => ({
    meta: [
      { title: "Campeões - FSX" },
      { name: "description", content: "Histórico de campeões da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Campeões</h1>
      <p className="text-muted-foreground">Campeões — em construção</p>
    </div>
  );
}
