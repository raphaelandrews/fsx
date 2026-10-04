import { Link } from "@tanstack/react-router";

import type { RecordEntry } from "@fsx/api/gamification/records";
import { cn } from "@fsx/ui/lib/utils";

import { Medal } from "@/components/gamification/medal";

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
  return (
    // Card radius 16px = row radius 8px + card padding 8px.
    <section className="rounded-2xl bg-muted p-2">
      <h2 className="px-2 pt-2 pb-3 font-semibold text-sm text-balance">{title}</h2>
      {entries.length === 0 ? (
        <p className="px-2 pb-2 text-muted-foreground text-sm">Sem registros ainda.</p>
      ) : (
        <ol className="flex flex-col">
          {entries.map((entry) => (
            <li key={entry.player.id}>
              <Link
                to="/jogadores/$id"
                params={{ id: entry.player.id }}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-ring",
                  entry.place === 1 && "bg-background/60",
                )}
              >
                <span className="flex w-7 shrink-0 justify-center">
                  {entry.place <= 3 ? (
                    <Medal place={entry.place as 1 | 2 | 3} className="size-7 justify-center rounded-full p-0" />
                  ) : (
                    <span className="text-muted-foreground text-xs tabular-nums">{entry.place}º</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium group-hover:underline">{entry.player.nickname || entry.player.name}</span>
                  {!entry.player.active && <span className="ml-1.5 text-muted-foreground text-xs">inativo</span>}
                  {detail(entry) && <span className="block truncate text-muted-foreground text-xs">{detail(entry)}</span>}
                </span>
                <span className={cn("shrink-0 tabular-nums", entry.place === 1 ? "font-semibold" : "font-medium text-foreground/80")}>
                  {format(entry.value)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
