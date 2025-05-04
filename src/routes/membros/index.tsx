import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/membros/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/membros/"!</div>
}
