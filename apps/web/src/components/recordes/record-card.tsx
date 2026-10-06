import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { RecordEntry } from "@fsx/api/gamification/records";
import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { Medal } from "@/components/gamification/medal";

// The top 5 keeps the page scannable; the rest of the top 10 is one tap away.
const PREVIEW_SIZE = 5;

export function RecordCard({
  title,
  entries,
  format,
  detail = (entry) => (entry.detail === "anterior" ? "anterior aos registros" : entry.detail),
}: {
  title: string;
  entries: RecordEntry[];
  format: (value: number) => string;
  detail?: (entry: RecordEntry) => string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, PREVIEW_SIZE);
  return (
    // Card radius 16px = row radius 8px + card padding 8px.
    <section className="min-w-0 rounded-2xl border border-border bg-muted p-2">
      <h2 className="px-2 pt-2 pb-3 font-semibold text-base text-balance">{title}</h2>
      {entries.length === 0 ? (
        <p className="px-2 pb-2 text-muted-foreground text-base">Sem registros ainda.</p>
      ) : (
        <ol className="flex flex-col">
          {visible.map((entry) => (
            <li key={entry.player.id}>
              <Link
                to="/jogadores/$id"
                params={{ id: entry.player.id }}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 text-base transition-colors duration-150 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
                )}
              >
                <span className="flex w-7 shrink-0 justify-center">
                  {entry.place <= 3 ? (
                    <Medal place={entry.place as 1 | 2 | 3} className="size-7 justify-center rounded-full p-0" />
                  ) : (
                    <span className="text-muted-foreground text-sm tabular-nums">{entry.place}º</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold underline-reveal underline-reveal-primary group-hover:after:left-0 group-hover:after:w-full group-focus-visible:after:left-0 group-focus-visible:after:w-full">
                    {entry.player.nickname || entry.player.name}
                  </span>
                  {!entry.player.active && <span className="ml-1.5 text-muted-foreground text-sm">inativo</span>}
                  {detail(entry) && <span className="block truncate text-muted-foreground text-sm">{detail(entry)}</span>}
                </span>
                <span className={cn("shrink-0 tabular-nums", entry.place === 1 ? "font-semibold" : "font-medium text-foreground/80")}>
                  {format(entry.value)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {entries.length > PREVIEW_SIZE && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            buttonVariants({ variant: "default", size: "xl" }),
            "mt-1 w-full rounded-lg active:scale-[0.96] aria-expanded:bg-primary aria-expanded:text-primary-foreground",
          )}
        >
          {expanded ? "Ver menos" : `Ver top ${entries.length}`}
          <HugeiconsIcon
            aria-hidden
            className="size-4"
            icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
            strokeWidth={2}
          />
        </button>
      )}
    </section>
  );
}
