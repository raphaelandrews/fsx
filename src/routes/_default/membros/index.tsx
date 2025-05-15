import { createFileRoute, ErrorComponent } from "@tanstack/react-router";

import { siteConfig } from "~/utils/config";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/membros/")({
  head: () => ({
    meta: [
      {
        title: `Membros | ${siteConfig.name}`,
        description: "Diretoria e árbitros da FSX",
        ogUrl: `${siteConfig.url}/membros`,
        image: `${siteConfig.url}/og/og.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/membros/"!</div>;
}
