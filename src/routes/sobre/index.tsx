import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sobre/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/sobre/"!</div>
}
