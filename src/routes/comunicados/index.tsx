import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/comunicados/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/comunicados/"!</div>
}
