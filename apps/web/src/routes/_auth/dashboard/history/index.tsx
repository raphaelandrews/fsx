import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@fsx/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fsx/ui/components/select";

import { HistoryRow } from "@/components/admin/change-history";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/data-table/pagination";
import { useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
  page: z.number().int().min(1).max(1_000).catch(1).default(1),
  entity: z.enum(["player", "tournament", "podium"]).optional().catch(undefined),
  recordId: z.number().int().positive().safe().optional().catch(undefined),
});

export const Route = createFileRoute("/_auth/dashboard/history/")({
  head: () => ({ meta: [{ title: "History - Admin - FSX" }] }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(context.trpc.history.list.queryOptions(deps)),
  component: RouteComponent,
});

const ENTITY_LABELS = { player: "Players", tournament: "Tournaments", podium: "Podiums" } as const;
const ALL = "all";

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(trpc.history.list.queryOptions(search));
  const filtered = search.entity !== undefined || search.recordId !== undefined;

  return (
    <>
      <AdminPageHeader
        title="History"
        description="What was changed in players, tournaments, and podiums, with the values before and after. Entries are kept for 2 years. Rating results have their own history on each player."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          value={search.entity ?? ALL}
          onValueChange={(next) => next && navigate({ to: "/dashboard/history", search: { entity: next === ALL ? undefined : (next as keyof typeof ENTITY_LABELS) } })}
        >
          <SelectTrigger className="h-8 min-w-40 text-sm" aria-label="Record type">
            <SelectValue>{(current) => (current === ALL || !current ? "All records" : ENTITY_LABELS[current as keyof typeof ENTITY_LABELS])}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All records</SelectItem>
            {Object.entries(ENTITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {search.recordId ? <span className="text-muted-foreground text-sm">Record #{search.recordId}</span> : null}
        {filtered ? (
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard/history", search: {} })}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {data.entries.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{filtered ? "No changes match these filters." : "Nothing has been changed yet."}</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-background px-4">
          {data.entries.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} showRecord />
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={data.pagination.currentPage}
          hasNextPage={data.pagination.hasNextPage}
          hasPreviousPage={data.pagination.hasPreviousPage}
          totalPages={data.pagination.totalPages}
          onPageChange={(page) => navigate({ to: "/dashboard/history", search: { ...search, page } })}
          onPagePreload={(page) => void router.preloadRoute({ to: "/dashboard/history", search: { ...search, page } })}
        />
      </div>
    </>
  );
}
