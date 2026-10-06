import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, FoldersIcon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Announcement } from "@/components/announcement";
import { FlickeringGrid } from "@/components/flickering-grid";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";
import { resolveLinkIcon } from "@fsx/api/link-icons";

export const Route = createFileRoute("/links")({
  head: () =>
    buildSeo({
      title: withBrand("Links Úteis"),
      description:
        "Links úteis e recursos de xadrez selecionados pela Federação Sergipana de Xadrez.",
      path: "/links",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Links", path: "/links" },
      ]),
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
});

function LinkIcon({ icon, muted = false }: { icon: string; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-200 [&_svg]:size-4 ${muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"}`}
      dangerouslySetInnerHTML={{ __html: resolveLinkIcon(icon) }}
    />
  );
}

function LinkItem({ href, label, icon }: { href: string | null; label: string; icon: string }) {
  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed p-3">
        <LinkIcon icon={icon} muted />
        <span className="flex-1 text-muted-foreground">{label}</span>
        <span className="text-muted-foreground text-sm">em breve</span>
      </div>
    );
  }

  return (
    <a
      className="group flex items-center gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <LinkIcon icon={icon} />
      <span className="flex-1 font-semibold">{label}</span>
      <HugeiconsIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
        icon={ArrowUpRight01Icon}
      />
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

function RouteComponent() {
  const trpc = useTRPC();
  const { data: linkGroups = [] } = useSuspenseQuery(trpc.links.list.queryOptions());

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <main className="relative flex-1">
        <section>
          <div className="relative mx-2 p-3 sm:mx-8 md:mx-auto md:max-w-[720px] md:p-3">
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              <FlickeringGrid
                className="absolute inset-0 z-0 size-full [mask-image:radial-gradient(450px_circle_at_50%_50%,white,transparent)]"
                color="#4873ff"
                flickerChance={0.1}
                gridGap={6}
                maxOpacity={0.5}
                squareSize={4}
              />
            </div>

            <h1 className="sr-only">Links</h1>
            <div className="flex justify-center py-6">
              <Logo className="h-5 text-foreground" />
            </div>

            {linkGroups
              .filter((item) => (item.links?.length ?? 0) > 0)
              .map((item) => (
                <section className="mb-6" key={item.id}>
                  <Announcement icon={FoldersIcon} label={item.event?.name ?? item.label} />
                  <ul className="flex flex-col">
                    {item.links?.map((link) => (
                      <li key={link.id} className="m-1">
                        <LinkItem href={link.href} icon={link.icon} label={link.label} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
