import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/titulados")({
  head: () => ({
    meta: [
      { title: "Titulados - FSX" },
      { name: "description", content: "Jogadores titulados da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.titledPlayers.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">Titulados</h1>
      <p className="text-muted-foreground">Titulados — em construção</p>
    </div>
  );
}
