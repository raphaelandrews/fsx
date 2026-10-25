import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { EntityListPage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/lib/trpc";
import { SCORING_SCHEME_SECTIONS, parseSchemePoints } from "@/lib/admin-forms";

export const Route = createFileRoute("/_auth/dashboard/scoring-schemes/")({
  head: () => ({ meta: [{ title: "Scoring schemes - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.scoringSchemes.list.queryOptions()),
  component: RouteComponent,
});

type Row = ReturnType<typeof useRows>[number];

const columns: ColumnDef<Row>[] = [
  {
    id: "points",
    header: "Points by place",
    cell: ({ row }) => <span className="tabular-nums">{row.original.places.map((entry) => entry.points).join(", ")}</span>,
  },
];

function useRows() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.scoringSchemes.list.queryOptions()).data;
}

function RouteComponent() {
  const trpc = useTRPC();
  const rows = useRows();
  const deleteMutation = useAdminMutation(trpc.scoringSchemes.delete.mutationOptions(), {
    invalidates: "scoringSchemes",
    ...entityMessages("scoring scheme").delete,
  });
  const createMutation = useAdminMutation(trpc.scoringSchemes.create.mutationOptions(), {
    invalidates: "scoringSchemes",
    ...entityMessages("scoring scheme").create,
  });

  return (
    <EntityListPage
      noun="scoring scheme"
      plural="scoring schemes"
      basePath="/dashboard/scoring-schemes"
      title="Scoring schemes"
      description="Points by place that prefill circuit and School Games results."
      rows={rows}
      columns={columns}
      deleting={deleteMutation.isPending}
      onDelete={(id) => deleteMutation.mutate({ id })}
      create={{
        description: "Create a scheme, then pick it on a circuit or a tournament.",
        sections: SCORING_SCHEME_SECTIONS,
        defaultValues: { name: "", points: "10, 8, 6, 5, 4, 3, 2, 1" },
        onSubmit: (values, close) => {
          const places = parseSchemePoints(values.points!);
          if (places) createMutation.mutate({ name: values.name!, places }, { onSuccess: close });
        },
        error: createMutation.error,
        pending: createMutation.isPending,
      }}
    />
  );
}
