import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { federationToday } from "@fsx/api/lib/dates";

import { CalendarEvent } from "@/components/calendario/calendar-event";
import { groupByMonthOfYear, monthName, monthShort } from "@/components/calendario/dates";
import { PageHeader } from "@/components/page-header";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { calendarSearchSchema } from "@/lib/search-schemas";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/lib/trpc";

const inputOf = (search: { mes?: number }) => ({
  year: Number(federationToday().slice(0, 4)),
  month: search.mes,
});

const isUpcomingView = (search: { mes?: number; ver?: "ano" }) => search.mes === undefined && search.ver === undefined;

const queryFor = (trpc: ReturnType<typeof useTRPC>, search: { mes?: number; ver?: "ano" }) =>
  isUpcomingView(search) ? trpc.events.upcoming.queryOptions() : trpc.events.calendar.queryOptions(inputOf(search));

export const Route = createFileRoute("/_public/calendario")({
  validateSearch: calendarSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(queryFor(context.trpc, deps)),
  head: ({ match }) => {
    const { mes, ver } = match.search;
    const year = Number(federationToday().slice(0, 4));
    return buildSeo({
      title: withBrand(mes ? `Calendário — ${monthName(mes)} de ${year}` : ver ? `Calendário ${year}` : "Próximos eventos"),
      description: "Calendário de torneios e eventos de xadrez em Sergipe, com inscrição, regulamento e resultados.",
      path: "/calendario",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Calendário", path: "/calendario" },
      ]),
    });
  },
  pendingComponent: () => <CardGridSkeleton />,
  component: RouteComponent,
});

const chip = (active: boolean) =>
  cn(buttonVariants({ variant: active ? "default" : "outline", size: "sm" }), "capitalize active:scale-[0.96]");

function RouteComponent() {
  const trpc = useTRPC();
  const search = Route.useSearch();
  const input = inputOf(search);
  const upcoming = isUpcomingView(search);
  const { data: events } = useSuspenseQuery(queryFor(trpc, search));
  const today = federationToday();
  const groups =
    events.length === 0
      ? []
      : upcoming
        ? groupByMonthOfYear(events)
        : input.month
          ? ([[`${input.year}-${String(input.month).padStart(2, "0")}`, events]] as [string, typeof events][])
          : groupByMonthOfYear(events, input.year);

  return (
    <>
      <PageHeader
        icon={Calendar01Icon}
        title="Calendário"
        description="Torneios e eventos de xadrez em Sergipe."
      />

      <nav aria-label="Mês" className="mb-6 flex flex-wrap gap-1.5">
        <Link to="/calendario" className={chip(upcoming)} aria-current={upcoming ? "page" : undefined}>
          Próximos
        </Link>
        <Link to="/calendario" search={{ ver: "ano" }} className={chip(!upcoming && !input.month)} aria-current={!upcoming && !input.month ? "page" : undefined}>
          Ano todo
        </Link>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
          <Link
            key={month}
            to="/calendario"
            search={{ mes: month }}
            className={chip(input.month === month)}
            aria-current={input.month === month ? "page" : undefined}
            aria-label={monthName(month)}
          >
            {monthShort(month)}
          </Link>
        ))}
      </nav>

      {groups.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {upcoming ? "Nenhum evento marcado por enquanto." : `Nenhum evento ${input.month ? `em ${monthName(input.month)} de` : "em"} ${input.year}.`}
        </p>
      ) : (
        <div className="grid gap-8">
          {groups.map(([key, monthEvents]) => (
            <section key={key} aria-labelledby={`mes-${key}`}>
              <h2 id={`mes-${key}`} className="mb-3 font-semibold text-lg capitalize">
                {monthName(Number(key.slice(5, 7)))}
                {Number(key.slice(0, 4)) !== input.year ? ` de ${key.slice(0, 4)}` : ""}
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {monthEvents.map((event) => (
                  <CalendarEvent key={event.id} event={event} today={today} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 text-muted-foreground text-sm">
        Procurando a planilha antiga?{" "}
        <a
          className="link-inline"
          href="https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM"
          rel="noreferrer"
          target="_blank"
        >
          Abrir planilha<span className="sr-only"> (abre em nova aba)</span>
        </a>
      </p>
    </>
  );
}
