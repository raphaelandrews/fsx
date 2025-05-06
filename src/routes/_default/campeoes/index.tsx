import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_default/campeoes/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/campeoes/"!</div>
}
