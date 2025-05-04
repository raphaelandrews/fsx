import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/circuitos/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/circuitos/"!</div>
}
