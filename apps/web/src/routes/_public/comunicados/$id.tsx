import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ScrollIcon } from "@hugeicons/core-free-icons";

import { useTRPC } from "@/utils/trpc";
import { padNumber } from "@/utils/format";
import { breadcrumbJsonLd, buildSeo, truncate, withBrand } from "@/lib/seo";
import { getErrorCode } from "@/lib/errors";
import { idParams } from "@/lib/route-params";

export const Route = createFileRoute("/_public/comunicados/$id")({
  params: idParams,
  loader: async ({ context, params }) => {
    const { id } = params;
    try {
      const announcement = await context.queryClient.ensureQueryData(
        context.trpc.announcements.byId.queryOptions({ id }),
      );
      if (!announcement) throw notFound();
      return announcement;
    } catch (error) {
      if (error instanceof Response) throw error;
      if (getErrorCode(error) === "NOT_FOUND") throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => {
    const announcement = loaderData;
    if (!announcement) {
      return buildSeo({
        title: withBrand("Comunicado"),
        path: "/comunicados",
        noindex: true,
      });
    }
    const label = `Comunicado ${padNumber(announcement.number)}/${announcement.year}`;
    const path = `/comunicados/${announcement.id}`;
    const description = truncate(announcement.content);
    return buildSeo({
      title: withBrand(label),
      description,
      path,
      type: "article",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Comunicados", path: "/comunicados" },
        { name: label, path },
      ]),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { id } = Route.useParams();
  const { data: announcement } = useSuspenseQuery(
    trpc.announcements.byId.queryOptions({ id: id }),
  );

  if (!announcement) return null;

  return (
    <article className="mx-auto max-w-2xl pt-10 md:pt-16">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 text-base font-medium text-muted-foreground">
          <HugeiconsIcon className="size-4 text-primary" icon={ScrollIcon} />
          Comunicado oficial
        </div>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Comunicado {padNumber(announcement.number)}/{announcement.year}
        </h1>
      </header>

      <div className="mt-8 whitespace-pre-line text-pretty text-base text-reading leading-relaxed sm:text-lg">
        {announcement.content}
      </div>

      {announcement.player && (
        <p className="mt-8 border-t pt-4 text-base text-muted-foreground">
          Jogador:{" "}
          <Link
            to="/jogadores/$id"
            params={{ id: announcement.player.id }}
            className="link-inline"
          >
            {announcement.player.nickname || announcement.player.name}
          </Link>
        </p>
      )}
    </article>
  );
}
