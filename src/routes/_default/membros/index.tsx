import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_default/membros/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/membros/"!</div>
}
