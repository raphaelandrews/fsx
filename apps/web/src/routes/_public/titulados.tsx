import { Bookmark01Icon } from "@hugeicons/core-free-icons"
import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { Announcement } from "@/components/announcement"
import { TitledPlayersTable } from "@/components/titulados/titled-players-table"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_public/titulados")({
  head: () => ({
    meta: [
      { title: "Titulados - FSX" },
      {
        name: "description",
        content: "Titulados da Federação Sergipana de Xadrez.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.titledPlayers.list.queryOptions()),
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const { data: titledPlayers = [] } = useSuspenseQuery(
    trpc.titledPlayers.list.queryOptions()
  )

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Announcement icon={Bookmark01Icon} label="Titulados" />
      <TitledPlayersTable data={titledPlayers} />
    </div>
  )
}
