import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
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
  pendingComponent: () => <TableSkeleton />,
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const { data: titledPlayers = [] } = useSuspenseQuery(
    trpc.titledPlayers.list.queryOptions()
  )

  return (
    <>
      <PageHeader title="Titulados" />
      <TitledPlayersTable data={titledPlayers} />
    </>
  )
}
