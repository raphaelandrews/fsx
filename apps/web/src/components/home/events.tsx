import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Trophy } from "@hugeicons/core-free-icons";

import { Button, buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { resolveEventLinkType } from "@fsx/api/event-link-types";

import { Section } from "./section";
import { StatusDot } from "./status-dot";

export interface EventLink {
  id: number;
  href: string | null;
  label: string;
  type: string;
  sortOrder: number;
}

export interface Event {
  id: number;
  name: string;
  startDate: string;
  linkGroup?: { id: number; links: EventLink[] } | null;
}

// Preference order for the three recurring event link types.
const PREFERENCE: Record<string, number> = { form: 0, regulation: 1, results: 2 };

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
      <div className="grid sm:grid-cols-2 md:grid-cols-3">
        {upcoming.map((event) => (
          <EventCard
            key={event.id}
            name={event.name}
            startDate={event.startDate}
            links={event.linkGroup?.links ?? []}
          />
        ))}
      </div>
    </Section>
  );
}

function EventCard({
  name,
  startDate,
  links,
}: {
  name: string;
  startDate: string | Date;
  links: EventLink[];
}) {
  // startDate is a date-only "YYYY-MM-DD" string. new Date("YYYY-MM-DD")
  // parses as UTC midnight; formatting that in America/Sao_Paulo (UTC-3)
  // shifts it back a day (17 -> 16). Parse as UTC and format in UTC so the
  // stored calendar date renders exactly, with identical server/client output.
  const dateObj = typeof startDate === "string" ? new Date(startDate + "T00:00:00Z") : startDate;

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(dateObj)
    .replace(/de\s/g, "")
    .replace(".", "")
    .replace(/^\d+\s(\w)/, (match, p1) => match.replace(p1, p1.toUpperCase()))
    .replace(/^1\s/, "1º ");

  // Normalize the stored type (legacy event links are "link") from the label so
  // Formulário/Regulamento/Chess-Results are recognized for the layout.
  const resolved = links.map((link) => ({
    ...link,
    type: resolveEventLinkType(link.type, link.label),
  }));
  const ordered = [...resolved].sort(
    (a, b) => (PREFERENCE[a.type] ?? 9) - (PREFERENCE[b.type] ?? 9) || a.sortOrder - b.sortOrder,
  );

  const renderLink = (link: EventLink, extra?: string) => (
    <LinkAction
      key={link.id}
      link={link}
      variant={link.type === "form" ? "default" : "outline"}
      className={extra}
    />
  );

  const linksContent = (() => {
    if (ordered.length === 0) {
      return (
        <Button variant="secondary" disabled className="mt-1 h-9 w-full" size="sm">
          Em Breve
        </Button>
      );
    }
    if (ordered.length === 1) {
      return <div className="mt-1">{renderLink(ordered[0], "w-full")}</div>;
    }
    if (ordered.length === 2) {
      return (
        <div className="mt-1 flex flex-col gap-2">
          {ordered.map((link) => renderLink(link, "w-full"))}
        </div>
      );
    }
    // Three or more: the form link is the full-width primary CTA, the rest are
    // side by side (Regulamento on the left, Chess-Results on the right).
    const formLink = ordered.find((link) => link.type === "form");
    const rest = ordered.filter((link) => link.type !== "form");
    return (
      <div className="mt-1 flex flex-col gap-2">
        {formLink && renderLink(formLink, "w-full")}
        {rest.length > 0 && (
          <div className="grid md:grid-cols-2 gap-2">
            {rest.map((link) => renderLink(link))}
          </div>
        )}
      </div>
    );
  })();

  return (
    <div>
      <div className="m-1">
        <div className="flex items-center justify-between p-3">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold leading-tight line-clamp-2">{name}</h3>
              <StatusDot date={startDate} />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground select-none text-xs font-medium">
              <HugeiconsIcon icon={Calendar01Icon} size={14} /> <span>{formattedDate}</span>
            </div>
            {linksContent}
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkAction({
  link,
  variant,
  className,
}: {
  link: EventLink;
  variant: "default" | "outline";
  className?: string;
}) {
  const inner = (
    <>
      {link.label}
      {!link.href && <span className="ml-1 text-xs opacity-70">(em breve)</span>}
    </>
  );

  // Real anchor keeps native open-in-new-tab/middle-click behavior, styled
  // with the shared button variants.
  if (link.href) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant, size: "sm" }), "h-9", className)}
      >
        {inner}
      </a>
    );
  }

  return (
    <Button size="sm" variant={variant} className={cn("h-9", className)} disabled>
      {inner}
    </Button>
  );
}
