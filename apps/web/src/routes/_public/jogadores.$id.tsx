import { createFileRoute, notFound } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { PlayerProfile } from "@/components/player/player-profile"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_public/jogadores/$id")({
  head: () => ({
    meta: [
      { title: "Jogador - FSX" },
      { name: "description", content: "Perfil do jogador." },
    ],
  }),
  loader: async ({ context, params }) => {
    try {
      const player = await context.queryClient.ensureQueryData(
        context.trpc.players.byId.queryOptions({ id: Number(params.id) })
      )
      if (!player) throw notFound()
      return player
    } catch (error) {
      if (error instanceof Response) throw error
      throw notFound()
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(trpc.players.byId.queryOptions({ id: Number(id) }))

  if (!data) return null

  return (
    <div className="mx-auto max-w-[720px]">
      <PlayerProfile player={data} />
    </div>
  )
}
