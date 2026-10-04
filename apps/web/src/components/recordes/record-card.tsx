import { Link } from "@tanstack/react-router";

import type { RecordEntry } from "@fsx/api/gamification/records";

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
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <h2 className="mb-3 font-semibold text-sm">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sem registros ainda.</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.player.id} className="flex items-start gap-3 text-sm">
              <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">{entry.place}º</span>
              <span className="min-w-0 flex-1">
                <Link to="/jogadores/$id" params={{ id: entry.player.id }} className="font-medium hover:underline">
                  {entry.player.nickname || entry.player.name}
                </Link>
                {!entry.player.active && <span className="ml-1.5 text-muted-foreground text-xs">inativo</span>}
                {detail(entry) && <span className="block truncate text-muted-foreground text-xs">{detail(entry)}</span>}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{format(entry.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
