import {
  createFileRoute,
  ErrorComponent,
  HeadContent,
} from "@tanstack/react-router";

import { siteConfig } from "~/utils/config";
import { seo } from "~/utils/seo";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/titulados/")({
  head: () => ({
    meta: [
      ...seo({
        title: `Titulados | ${siteConfig.name}`,
        description: "Titulados FSX",
        ogUrl: `${siteConfig.url}/titulados`,
        image: `${siteConfig.url}/og/og.jpg`,
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
      <div>Hello "/titulados/"!</div>
    </>
  );
}
