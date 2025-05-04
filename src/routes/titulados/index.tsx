import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/titulados/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/titulados/"!</div>
}
