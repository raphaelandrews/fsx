import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_params/players/$id")({
  head: () => ({
    title: "Jogador - FSX",
    meta: [
      { name: "description", content: "Perfil do jogador da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: ({ context, params }) =>
    context.trpc.players.byId.ensureQueryData({ id: Number(params.id) }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { id } = Route.useParams();
  const [player] = useSuspenseQuery(trpc.players.byId.queryOptions({ id: Number(id) }));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-bold text-2xl">{player.name}</h1>
      <p className="text-muted-foreground">Jogador — em construção</p>
    </div>
  );
}
