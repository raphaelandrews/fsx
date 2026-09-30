import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/page-header";
import { BulletClient } from "@/components/bullet/bullet-client";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_public/bullet")({
  head: () =>
    buildSeo({
      title: withBrand("Sergipano Bullet"),
      description:
        "Classificação, resultados e chaveamento do Campeonato Sergipano Bullet de Xadrez.",
      path: "/bullet",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Bullet", path: "/bullet" },
      ]),
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.cups.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: cups = [] } = useSuspenseQuery(trpc.cups.list.queryOptions());

  const cup = cups.find((c) => c.name.toLowerCase().includes("bullet")) ?? cups[0];

  if (!cup) {
    return (
      <>
        <PageHeader title="Sergipano Bullet" />
        <p className="text-muted-foreground">
          Nenhuma edição do Campeonato Sergipano Bullet disponível.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Sergipano Bullet" />
      <BulletClient cup={cup} />
    </>
  );
}
