import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/noticias/$noticiaSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/noticias/$noticiaSlug"!</div>
}
