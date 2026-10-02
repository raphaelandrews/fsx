import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PlayerProfile } from "@/components/player/player-profile";
import { breadcrumbJsonLd, buildSeo, personJsonLd, withBrand } from "@/lib/seo";
import { getErrorCode } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/jogadores/$id")({
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    if (!Number.isSafeInteger(id) || id < 1) throw notFound();
    try {
      const player = await context.queryClient.ensureQueryData(
        context.trpc.players.byId.queryOptions({ id }),
      );
      if (!player) throw notFound();
      return player;
    } catch (error) {
      if (error instanceof Response) throw error;
      if (getErrorCode(error) === "NOT_FOUND") throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => {
    const player = loaderData;
    if (!player) {
      return buildSeo({ title: withBrand("Jogador"), path: "/ratings", noindex: true });
    }
    const path = `/jogadores/${player.id}`;
    const club = player.club?.name ? ` do ${player.club.name}` : "";
    const description = `Perfil de ${player.name}${club} no xadrez sergipano — ratings clássico ${player.classic}, rápido ${player.rapid} e blitz ${player.blitz}.`;
    return buildSeo({
      title: withBrand(player.name),
      description,
      path,
      image: player.imageUrl,
      type: "profile",
      jsonLd: [
        personJsonLd({ name: player.name, path, image: player.imageUrl, description }),
        breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Ratings", path: "/ratings" },
          { name: player.name, path },
        ]),
      ],
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(trpc.players.byId.queryOptions({ id: Number(id) }));

  if (!data) return null;

  return (
    <div className="mx-auto max-w-[720px]">
      <PlayerProfile player={data} />
    </div>
  );
}
