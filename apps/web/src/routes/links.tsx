import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { orderedEventLinks } from "@/components/events/event-links";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { MAIN_ID, SkipLink } from "@/components/skip-link";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/lib/trpc";
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
    context.queryClient.ensureQueryData(context.trpc.links.page.queryOptions()),
  component: RouteComponent,
});

function LinkIcon({ icon, muted = false }: { icon: string; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-9 place-items-center rounded-full transition-colors duration-200 [&_svg]:size-5 ${muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"}`}
      dangerouslySetInnerHTML={{ __html: resolveLinkIcon(icon) }}
    />
  );
}

const LINK_BUTTON = "grid min-h-14 grid-cols-[2.25rem_1fr_2.25rem] items-center gap-3 rounded-full border px-2.5 py-2";

function LinkItem({ href, label, icon }: { href: string | null; label: string; icon: string }) {
  if (!href) {
    return (
      <div className={`${LINK_BUTTON} border-dashed text-muted-foreground`}>
        <LinkIcon icon={icon} muted />
        <span className="text-center font-semibold">{label}</span>
        <span className="text-right text-sm pr-2">em breve</span>
      </div>
    );
  }

  return (
    <a
      className={`${LINK_BUTTON} group bg-background transition-[color,background-color,transform] duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ring`}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <LinkIcon icon={icon} />
      <span className="text-center font-semibold">{label}</span>
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

function LinkSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-center font-semibold text-muted-foreground text-sm">{label}</h2>
      <ul className="grid gap-3">{children}</ul>
    </section>
  );
}

function RouteComponent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.links.page.queryOptions());

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <SkipLink />
      <main id={MAIN_ID} tabIndex={-1} className="relative flex-1 outline-none">
        <div className="mx-auto grid w-full max-w-md gap-8 px-4 pt-12 pb-10">
          <header className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-24 place-items-center rounded-avatar bg-muted">
              <Logo className="h-7 text-foreground" />
            </span>
            <h1 className="text-balance font-semibold text-2xl tracking-tight">Federação Sergipana de Xadrez</h1>
          </header>

          {data.groups.map((group) => (
            <LinkSection key={group.id} label={group.label}>
              {group.links.map((link) => (
                <li key={link.id}>
                  <LinkItem href={link.href} icon={link.icon} label={link.label} />
                </li>
              ))}
            </LinkSection>
          ))}

          {data.events.map((event) => (
            <LinkSection key={`event-${event.id}`} label={event.name}>
              {orderedEventLinks(event.linkGroup?.links).map((link) => (
                <li key={link.id}>
                  <LinkItem href={link.href} icon={link.icon} label={link.label} />
                </li>
              ))}
            </LinkSection>
          ))}
        </div>
      </main>
      <Footer showNav={false} />
    </div>
  );
}
