import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ZapIcon } from "@hugeicons/core-free-icons";

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
  loader: async ({ context }) => {
    const cups = await context.queryClient.ensureQueryData(context.trpc.cups.list.queryOptions());
    const cup = cups.find((item) => item.name.toLowerCase().includes("bullet")) ?? cups[0];
    if (!cup) return { cupId: null };
    await context.queryClient.ensureQueryData(context.trpc.cups.byId.queryOptions({ id: cup.id }));
    return { cupId: cup.id };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: cups = [] } = useSuspenseQuery(trpc.cups.list.queryOptions());

  const cup = cups.find((c) => c.id === Route.useLoaderData().cupId);

  if (!cup) {
    return (
      <>
        <PageHeader icon={ZapIcon} title="Sergipano Bullet" />
        <p className="text-muted-foreground">
          Nenhuma edição do Campeonato Sergipano Bullet disponível.
        </p>
      </>
    );
  }

  return <BulletCup id={cup.id} />;
}

function BulletCup({ id }: { id: number }) {
  const trpc = useTRPC();
  const { data: cup } = useSuspenseQuery(trpc.cups.byId.queryOptions({ id }));
  if (!cup) return null;

  return (
    <>
      <PageHeader icon={ZapIcon} title="Sergipano Bullet" />
      <BulletClient cup={cup} />
    </>
  );
}
