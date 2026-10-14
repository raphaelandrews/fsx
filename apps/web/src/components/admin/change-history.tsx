import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";
import { Badge } from "@fsx/ui/components/badge";

import { parseDbTimestamp } from "@/lib/format";
import { useTRPC } from "@/lib/trpc";

export type HistoryEntry = inferRouterOutputs<AppRouter>["history"]["list"]["entries"][number];

const timestamp = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" });

const FIELD_LABELS: Record<string, string> = {
  birthYear: "birth year",
  clubId: "club ID",
  locationId: "location ID",
  cbxId: "CBX ID",
  fideId: "FIDE ID",
  imageUrl: "photo",
  ratingType: "rating type",
  championshipId: "championship ID",
  chessResults: "Chess-Results link",
  playerId: "player ID",
  tournamentId: "tournament ID",
};

const show = (value: unknown) => (value === null || value === undefined || value === "" ? "—" : String(value));

export function describeChanges(entry: Pick<HistoryEntry, "action" | "changes">) {
  return Object.entries(entry.changes).map(([field, [before, after]]) => ({
    field: FIELD_LABELS[field] ?? field,
    text: entry.action === "create" ? show(after) : entry.action === "delete" ? show(before) : `${show(before)} → ${show(after)}`,
  }));
}

const ACTION_VARIANT = { create: "default", update: "secondary", delete: "destructive" } as const;

export function HistoryRow({ entry, showRecord }: { entry: HistoryEntry; showRecord?: boolean }) {
  const changes = describeChanges(entry);
  return (
    <li className="grid gap-1 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={ACTION_VARIANT[entry.action as keyof typeof ACTION_VARIANT]}>{entry.action}</Badge>
        {showRecord ? (
          <span className="font-medium">
            {entry.entity} · {entry.entity === "player" && entry.action !== "delete" ? (
              <Link to="/dashboard/players/$id" params={{ id: entry.recordId }} className="link-inline">
                {entry.label}
              </Link>
            ) : entry.entity === "tournament" && entry.action !== "delete" ? (
              <Link to="/dashboard/tournaments/$id" params={{ id: entry.recordId }} className="link-inline">
                {entry.label}
              </Link>
            ) : (
              entry.label
            )}
          </span>
        ) : null}
        <time className="text-muted-foreground" dateTime={entry.createdAt.replace(" ", "T") + "Z"}>
          {timestamp.format(parseDbTimestamp(entry.createdAt))}
        </time>
        <span className="text-muted-foreground">by {entry.actor}</span>
        <span className="text-muted-foreground text-xs">{entry.procedure}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-muted-foreground tabular-nums">
        {changes.map((change) => (
          <div key={change.field} className="contents">
            <dt>{change.field}</dt>
            <dd className="break-words text-foreground">{change.text}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

/** The latest changes to one record, for its edit page. */
export function ChangeHistory({ entity, recordId }: { entity: "player" | "tournament"; recordId: number }) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.history.list.queryOptions({ page: 1, entity, recordId }));
  return (
    <section aria-labelledby="history-heading" className="mt-10 space-y-2">
      <h2 id="history-heading" className="font-semibold text-lg">
        History
      </h2>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : data && data.entries.length > 0 ? (
        <>
          <ul className="divide-y rounded-2xl border bg-background px-4">
            {data.entries.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </ul>
          {data.pagination.totalItems > data.entries.length ? (
            <Link to="/dashboard/history" search={{ entity, recordId }} className="link-inline text-sm">
              See all {data.pagination.totalItems} changes
            </Link>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">No changes recorded yet. Changes are kept for 2 years.</p>
      )}
    </section>
  );
}
