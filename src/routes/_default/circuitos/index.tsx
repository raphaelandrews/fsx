import { createFileRoute, ErrorComponent } from "@tanstack/react-router";

import { siteConfig } from "~/utils/config";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/circuitos/")({
  head: () => ({
    meta: [
      {
        title: `Circuitos | ${siteConfig.name}`,
        description: "Circuitos de Xadrez de Sergipe",
        ogUrl: `${siteConfig.url}/circuitos`,
        image: `${siteConfig.url}/og/og-circuitos.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/circuitos/"!</div>;
}
