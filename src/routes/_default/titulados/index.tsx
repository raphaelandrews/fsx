import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_default/titulados/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/titulados/"!</div>
}
