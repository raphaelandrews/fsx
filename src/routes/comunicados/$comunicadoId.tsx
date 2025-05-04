import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/comunicados/$comunicadoId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/comunicados/$comunicadoId"!</div>
}
