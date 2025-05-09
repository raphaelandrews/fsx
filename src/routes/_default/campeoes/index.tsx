import {
  createFileRoute,
  ErrorComponent,
  HeadContent,
} from "@tanstack/react-router";

import { siteConfig } from "~/utils/config";
import { seo } from "~/utils/seo";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/campeoes/")({
  head: () => ({
    meta: [
      ...seo({
        title: `Galeria de Campeões | ${siteConfig.name}`,
        description: "Campeões Sergipanos",
        ogUrl: `${siteConfig.url}/campeoes`,
        image: `${siteConfig.url}/og/og-campeoes.jpg`,
        imageWidth: "1920",
        imageHeight: "1080",
      }),
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <HeadContent />
      <div>Hello "/campeoes/"!</div>
    </>
  );
}
