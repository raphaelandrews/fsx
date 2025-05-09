import { createFileRoute, ErrorComponent, HeadContent } from '@tanstack/react-router'

import { siteConfig } from '~/utils/config'
import { seo } from '~/utils/seo'
import { NotFound } from '~/components/not-found'

export const Route = createFileRoute('/_default/circuitos/')({
  head: () => ({
    meta: [
      ...seo({
        title: `Circuitos | ${siteConfig.name}`,
        description: "Circuitos de Xadrez de Sergipe",
        ogUrl: `${siteConfig.url}/circuitos`,
        image: `${siteConfig.url}/og/og-circuitos.jpg`,
        imageWidth: "1920",
        imageHeight: "1080",
      }),
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <HeadContent />
      <div>Hello "/circuitos/"!</div>
    </>
  );
}
