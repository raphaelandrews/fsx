import { CrownIcon } from "@hugeicons/core-free-icons"
import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { Announcement } from "@/components/announcement"
import { ChampionsTabs } from "@/components/campeoes/champions-tabs"
import type { ChampionTournament } from "@/components/campeoes/columns"
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
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Announcement icon={CrownIcon} label="Campeões" />
      <ChampionsTabs championshipMap={championshipMap} />
    </div>
  )
}
