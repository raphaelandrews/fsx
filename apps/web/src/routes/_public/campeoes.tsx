import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { ChampionsTabs } from "@/components/campeoes/champions-tabs"
import type { ChampionTournament } from "@/components/campeoes/columns"
import { PageHeader } from "@/components/page-header"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_public/campeoes")({
  head: () => ({
    meta: [
      { title: "Galeria de Campeões - FSX" },
      { name: "description", content: "Campeões Sergipanos." },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.champions.gallery.queryOptions()),
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const { data: championships = [] } = useSuspenseQuery(
    trpc.champions.gallery.queryOptions()
  )

  const championshipMap = championships.reduce<Record<string, ChampionTournament[]>>(
    (acc, championship) => {
      acc[championship.name] = championship.tournaments
      return acc
    },
    {}
  )

  return (
    <>
      <PageHeader title="Campeões" />
      <ChampionsTabs championshipMap={championshipMap} />
    </>
  )
}
