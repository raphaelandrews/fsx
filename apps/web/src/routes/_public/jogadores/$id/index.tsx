import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PlayerProfile } from "@/components/player/player-profile";
import { breadcrumbJsonLd, buildSeo, personJsonLd, withBrand } from "@/lib/seo";
import { orNotFound } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/jogadores/$id/")({
  loader: async ({ context, params }) => {
    const player = orNotFound(context.queryClient.ensureQueryData(context.trpc.players.byId.queryOptions({ id: params.id })));
    await Promise.all([
      player,
      orNotFound(context.queryClient.ensureQueryData(context.trpc.players.stats.queryOptions({ id: params.id }))),
      orNotFound(context.queryClient.ensureQueryData(context.trpc.players.circuitSeasons.queryOptions({ id: params.id }))),
      context.queryClient.ensureQueryData(context.trpc.announcements.byPlayer.queryOptions({ playerId: params.id })),
      orNotFound(context.queryClient.ensureQueryData(context.trpc.players.ranking.queryOptions({ id: params.id }))),
      // After the player resolves, so a 404 page does not carry every club.
      player.then(() => context.queryClient.ensureQueryData(context.trpc.clubs.leaderboard.queryOptions())),
    ]);
    return player;
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
  const { data } = useSuspenseQuery(trpc.players.byId.queryOptions({ id }));
  const { data: stats } = useSuspenseQuery(trpc.players.stats.queryOptions({ id }));
  const { data: circuitSeasons } = useSuspenseQuery(trpc.players.circuitSeasons.queryOptions({ id }));
  const { data: announcements } = useSuspenseQuery(trpc.announcements.byPlayer.queryOptions({ playerId: id }));
  const { data: ranking } = useSuspenseQuery(trpc.players.ranking.queryOptions({ id }));
  const { data: clubs } = useSuspenseQuery(trpc.clubs.leaderboard.queryOptions());
  const clubStanding = clubs.find((standing) => standing.club.id === data.club?.id) ?? null;

  return (
    <div className="mx-auto max-w-[720px]">
      <PlayerProfile player={data} stats={stats} circuitSeasons={circuitSeasons} announcements={announcements} ranking={ranking} clubStanding={clubStanding} />
    </div>
  );
}
