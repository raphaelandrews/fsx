import { createFileRoute, ErrorComponent } from "@tanstack/react-router";

import { siteConfig } from "~/utils/config";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/campeoes/")({
  head: () => ({
    meta: [
      {
        title: `Galeria de Campeões | ${siteConfig.name}`,
        description: "Campeões Sergipanos",
        ogUrl: `${siteConfig.url}/campeoes`,
        image: `${siteConfig.url}/og/og-campeoes.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/campeoes/"!</div>;
}
