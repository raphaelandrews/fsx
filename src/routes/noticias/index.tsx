import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/noticias/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/noticias/"!</div>
}
