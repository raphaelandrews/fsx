import { createFileRoute, ErrorComponent } from "@tanstack/react-router";

import { siteConfig } from "~/utils/config";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/titulados/")({
  head: () => ({
    meta: [
      {
        title: `Titulados | ${siteConfig.name}`,
        description: "Titulados FSX",
        ogUrl: `${siteConfig.url}/titulados`,
        image: `${siteConfig.url}/og/og.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/titulados/"!</div>;
}
