import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Calendar01Icon, Trophy } from "@hugeicons/core-free-icons";
import type { inferRouterOutputs } from "@trpc/server";

import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { resolveEventLinkType } from "@fsx/api/event-link-types";
import type { AppRouter } from "@fsx/api/routers/index";

import { Section } from "./section";

type Event = inferRouterOutputs<AppRouter>["events"]["list"][number];
type EventLink = NonNullable<Event["linkGroup"]>["links"][number];

const PREFERENCE: Record<string, number> = { form: 0, regulation: 1, results: 2 };

const DAY_MS = 86_400_000;
const dayNumber = (isoDate: string) => Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`) / DAY_MS;

export function Events({ events }: { events: Event[] }) {
  // Fixed timezone so the server (UTC) and client pick the same "today" and
  // avoid a hydration mismatch. en-CA yields an ISO YYYY-MM-DD string.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const upcoming = [...events]
    .filter((event) => (event.startDate ?? "").slice(0, 10) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 6);

  if (upcoming.length === 0) return null;

  return (
    <Section icon={Trophy} label="Próximos Eventos" main={false}>
      <ul className="grid gap-3 px-3 sm:grid-cols-2 sm:px-0 md:grid-cols-3">
        {upcoming.map((event) => (
          <li key={event.id}>
            <EventCard
              name={event.name}
              startDate={event.startDate}
              daysUntil={dayNumber(event.startDate) - dayNumber(today)}
              links={event.linkGroup?.links ?? []}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function countdown(days: number) {
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `Em ${days} dias`;
}

function EventCard({
  name,
  startDate,
  daysUntil,
  links,
}: {
  name: string;
  startDate: string;
  daysUntil: number;
  links: EventLink[];
}) {
  // startDate is a date-only "YYYY-MM-DD" string. new Date("YYYY-MM-DD")
  // parses as UTC midnight; formatting that in America/Sao_Paulo (UTC-3)
  // shifts it back a day (17 -> 16). Parse as UTC and format in UTC so the
  // stored calendar date renders exactly, with identical server/client output.
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${startDate.slice(0, 10)}T00:00:00Z`))
    .replace(/de\s/g, "")
    .replace(".", "")
    .replace(/^\d+\s(\w)/, (match, p1) => match.replace(p1, p1.toUpperCase()))
    .replace(/^1\s/, "1º ");

  // Normalize the stored type (legacy event links are "link") from the label so
  // Formulário/Regulamento/Chess-Results are recognized for the layout.
  const ordered = links
    .map((link) => ({ ...link, type: resolveEventLinkType(link.type, link.label) }))
    .sort((a, b) => (PREFERENCE[a.type] ?? 9) - (PREFERENCE[b.type] ?? 9) || a.sortOrder - b.sortOrder);
  const [first, ...rest] = ordered;

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl bg-muted p-4">
      <header className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-semibold text-base leading-snug">{name}</h3>
        {daysUntil <= 14 && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 font-semibold text-xs",
              daysUntil <= 7 ? "bg-warning text-warning-foreground" : "bg-background text-muted-foreground",
            )}
          >
            {countdown(daysUntil)}
          </span>
        )}
      </header>
      <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <HugeiconsIcon icon={Calendar01Icon} className="size-4" aria-hidden />
        <time dateTime={startDate.slice(0, 10)}>{formattedDate}</time>
      </p>

      {ordered.length === 0 ? (
        <p className="mt-auto text-muted-foreground text-sm">Links em breve</p>
      ) : (
        <div className="mt-auto flex flex-col gap-2">
          <LinkAction link={first} primary={first.type === "form"} />
          {rest.length > 0 && (
            <div className={cn("grid gap-2", rest.length > 1 && "sm:grid-cols-2")}>
              {rest.map((link) => (
                <LinkAction key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function LinkAction({ link, primary = false }: { link: EventLink; primary?: boolean }) {
  if (!link.href) {
    return (
      <span className="inline-flex h-9 items-center justify-center rounded-full border border-dashed px-3.5 text-muted-foreground text-sm">
        {link.label} · em breve
      </span>
    );
  }

  // Real anchor keeps native open-in-new-tab/middle-click behavior.
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: primary ? "default" : "outline", size: "lg" }), "w-full active:scale-[0.96]")}
    >
      {link.label}
      <HugeiconsIcon icon={ArrowUpRight01Icon} data-icon="inline-end" className="size-4" aria-hidden />
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}
