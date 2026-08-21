import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { BulletClient } from "@/components/bullet/bullet-client"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_public/bullet")({
  head: () => ({
    meta: [
      { title: "Sergipano Bullet - FSX" },
      {
        name: "description",
        content: "Campeonato Sergipano Bullet de Xadrez.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.cups.list.queryOptions()),
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const { data: cups = [] } = useSuspenseQuery(trpc.cups.list.queryOptions())

  const cup = cups.find((c) => c.name.toLowerCase().includes("bullet")) ?? cups[0]

  if (!cup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 font-bold text-2xl">Sergipano Bullet</h1>
        <p className="text-muted-foreground">
          Nenhuma edição do Campeonato Sergipano Bullet disponível.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BulletClient cup={cup} />
    </div>
  )
}
