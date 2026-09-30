import { createFileRoute } from "@tanstack/react-router";

import { NotFound } from "@/components/not-found";
import { buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  head: () =>
    buildSeo({
      title: withBrand("Página não encontrada"),
      description: "A página que você procura não existe ou foi movida.",
      path: "/404",
      noindex: true,
      canonical: false,
    }),
  component: NotFound,
});
