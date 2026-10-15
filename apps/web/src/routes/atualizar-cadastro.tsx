import { createFileRoute } from "@tanstack/react-router";

import { UpdateRequestForm } from "@/components/player/update-request-form";
import { buildSeo, withBrand } from "@/lib/seo";

// Outside the public layout on purpose: a focused, step-by-step page without the site header and footer.
export const Route = createFileRoute("/atualizar-cadastro")({
  head: () =>
    buildSeo({
      title: withBrand("Atualizar cadastro"),
      description: "Corrija ou complete os dados de um jogador e peça o selo de verificado da Federação Sergipana de Xadrez.",
      path: "/atualizar-cadastro",
      noindex: true,
      canonical: false,
    }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
  component: UpdateRequestForm,
});
